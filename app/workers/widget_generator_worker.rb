require 'fileutils'
class WidgetGeneratorWorker
  include Sidekiq::Worker
  include Sidekiq::Lock::Worker
  sidekiq_options lock: { timeout: 1200000, name: 'lock-worker' }

  def perform(client_id, widget_config, icon_url, widget_request_id)
    if lock.acquire! 
      begin
        config = widget_config
        
        parsed_config = JSON.parse(config)
        theme = parsed_config["theme"]
        color = parsed_config["color"]
        app_name = parsed_config["text"]["main"].parameterize
        app_name = "publisher_platform" if app_name.to_s.blank?
        phone_no = parsed_config["text"]["phone"]
        dest_folder_name = "public/widgets/#{widget_request_id}"
        FileUtils::mkdir_p dest_folder_name
        
        download = open(icon_url)
        IO.copy_stream(download, "#{dest_folder_name}/app_icon.png")
        
        download1 = open(icon_url)
        IO.copy_stream(download1, "#{dest_folder_name}/app_icon_orig.png")
        
        
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
        FileUtils::cp_r "widget/winstaller.js", dest_folder_name
        
        text = File.read("widget/js/src.js")
        new_contents = text.gsub("<<WIDGET_CONFIG>>", config)
        File.open("#{dest_folder_name}/js/src.js", "w") {|file| file.puts new_contents }
        
        text = File.read("widget/js/theme.js")
        new_contents = text.gsub("<<THEME>>", theme)
        new_contents = new_contents.gsub("<<COLOR>>", color)
        File.open("#{dest_folder_name}/js/theme.js", "w") {|file| file.puts new_contents }
        
        text = File.read("#{dest_folder_name}/winstaller.js")
        new_contents = text.gsub("<<APP_NAME>>", app_name.gsub(" ", ""))
        new_contents = new_contents.gsub("<<REQUEST_ID>>", widget_request_id.to_s)
        new_contents = new_contents.gsub("<<APP_NAME_LOWERCASE>>", app_name.downcase.gsub(" ", ""))
        File.open("#{dest_folder_name}/winstaller.js", "w") {|file| file.puts new_contents }
        
        text = File.read("#{dest_folder_name}/package.json")
        new_contents = text.gsub("<<APP_NAME_WITH_SPACE>>", app_name.gsub(" ",""))
        new_contents = new_contents.gsub("<<APP_NAME>>", app_name.gsub(" ", ""))
        new_contents = new_contents.gsub("<<APP_NAME_LOWERCASE>>", app_name.downcase.gsub(" ", ""))
        new_contents = new_contents.gsub("<<DEST_FOLDER>>", dest_folder_name)
        File.open("#{dest_folder_name}/package.json", "w") {|file| file.puts new_contents }
        
        FileUtils::cp_r "widget/package-lock.json", dest_folder_name
        
        uname = %x(uname)

        if uname.include?("Darwin")
          Dir.chdir(dest_folder_name.chomp) do
            system("npm install")
            system("png2icons app_icon.png app_icon -icns") 
            system("npm run package-mac")
            system("npm run installer-mac")
            system("npm run package-linux")
            system("npm run installer-linux")
            FileUtils::rm_rf "#{app_name.downcase}-darwin-x64"
            FileUtils::rm_rf "#{app_name.downcase}-linux-x64"
            FileUtils::rm_rf "windows_app"
            FileUtils::rm_rf "node_modules"
          end
        
          app_details = {
            widget_generation: {
              client_id: client_id,
              version: parsed_config["version"],
              app_url: "#{app_name.gsub(" ","")}.dmg",
              #windows_app_url: dw.windows_app.url,
              linux_app_url: "linux_app/#{app_name.downcase.gsub(" ","")}_1.0.1_amd64.deb",
              widget_icon_url: "app_icon_orig.png",
              widget_request_id: widget_request_id
            }
          }
        else
          Dir.chdir(dest_folder_name.chomp) do
            system("npm install")
            system("npm run package-win")
            system("node winstaller.js")
            system("zip -r application.zip windows_app/")
            FileUtils::rm_rf "windows_app"
            FileUtils::rm_rf "node_modules"
          end
        
          app_details = {
            widget_generation: {
              client_id: client_id,
              windows_app_url: "#{widget_request_id}/application.zip",
            }
          }
        end

        begin
          RestClient.post("#{SERVER_URL}/widget_generations", app_details) 
        rescue => exp
          puts exp.message
        end
      ensure
        lock.release!
      end
    else
      WidgetGeneratorWorker.perform_at(2.minutes.from_now, client_id, widget_config, icon_url, widget_request_id)
    end
  end
end
