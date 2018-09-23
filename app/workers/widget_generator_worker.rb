require 'fileutils'
class WidgetGeneratorWorker
  include Sidekiq::Worker

  def perform(client_id, widget_config, icon_url, widget_request_id)
    if File.exists?("tmp/widget_generation_worker.txt")
      WidgetGeneratorWorker.perform_at(2.minutes.from_now, client_id, widget_config, icon_url, widget_request_id)
    else
      File.new("tmp/widget_generation_worker.txt", "w")
      config = widget_config
      
      parsed_config = JSON.parse(config)
      theme = parsed_config["theme"]
      color = parsed_config["color"]
      app_name = parsed_config["text"]["main"]
      app_name = "publisher_platform" if app_name.to_s.blank?
      phone_no = parsed_config["text"]["phone"]
      dest_folder_name = "public/widgets/#{widget_request_id}"
      FileUtils::mkdir_p dest_folder_name
      
      download = open(icon_url)
      IO.copy_stream(download, "#{dest_folder_name}/app_icon.png")
      
      download1 = open(icon_url)
      IO.copy_stream(download1, "#{dest_folder_name}/app_icon_orig.png")
      
      system("png2icons #{dest_folder_name}/app_icon.png #{dest_folder_name}/app_icon -icns") 
      
      FileUtils::cp_r "widget/media", dest_folder_name
      FileUtils::cp_r "widget/css", dest_folder_name
      FileUtils::cp_r "widget/data", dest_folder_name
      FileUtils::cp_r "widget/icons", dest_folder_name
      FileUtils::cp_r "widget/js", dest_folder_name
      FileUtils::cp_r "widget/lib", dest_folder_name
      FileUtils::cp_r "widget/mimetype", dest_folder_name
      text = File.read("widget/phone.html")
      new_contents = text.gsub("<<PHONE_NUMBER>>", phone_no)
      File.open("#{dest_folder_name}/phone.html", "w") {|file| file.puts new_contents }
      FileUtils::cp_r "widget/themes", dest_folder_name
      
      FileUtils::cp_r "widget/index.html", dest_folder_name
      FileUtils::cp_r "widget/main.js", dest_folder_name
      FileUtils::cp_r "widget/config.json", dest_folder_name
      FileUtils::cp_r "widget/package.json", dest_folder_name
      
      text = File.read("widget/js/src.js")
      new_contents = text.gsub("<<WIDGET_CONFIG>>", config)
      File.open("#{dest_folder_name}/js/src.js", "w") {|file| file.puts new_contents }
      
      text = File.read("widget/js/theme.js")
      new_contents = text.gsub("<<THEME>>", theme)
      new_contents = new_contents.gsub("<<COLOR>>", color)
      File.open("#{dest_folder_name}/js/theme.js", "w") {|file| file.puts new_contents }
      
      text = File.read("#{dest_folder_name}/package.json")
      new_contents = text.gsub("<<APP_NAME_WITH_SPACE>>", app_name.gsub(" ",""))
      new_contents = new_contents.gsub("<<APP_NAME>>", app_name.gsub(" ", ""))
      new_contents = new_contents.gsub("<<DEST_FOLDER>>", dest_folder_name)
      File.open("#{dest_folder_name}/package.json", "w") {|file| file.puts new_contents }
      
      FileUtils::cp_r "widget/package-lock.json", dest_folder_name
      
      Dir.chdir(dest_folder_name.chomp) do
        system("npm install")
        sleep 2
        system("npm run package-mac")
        sleep 5
        system("npm run codesign-mac")
        sleep 5
        system("npm run installer-mac")
      end
      
      dw = DesktopWidget.create!(
        app: File.new("#{dest_folder_name}/#{app_name.gsub(" ","")}.dmg"), 
        app_name: app_name, 
        version: parsed_config["version"],
        client_id: client_id,
        widget_generation_request_id: widget_request_id,
        widget_icon: File.new("#{dest_folder_name}/app_icon_orig.png")
      )
      
      dw.reload
      
      app_details = { 
        widget_generation: {
          client_id: client_id,
          os: "Mac",
          version: parsed_config["version"],
          app_url: dw.app.url,
          widget_icon_url: dw.widget_icon.url,
          widget_request_id: widget_request_id
        }
      }
      
      begin
        RestClient.post("#{SERVER_URL}/widget_generations", app_details) 
      rescue => exp
        puts exp.message
      end
      File.delete("tmp/widget_generation_worker.txt")
    end
  end
end
