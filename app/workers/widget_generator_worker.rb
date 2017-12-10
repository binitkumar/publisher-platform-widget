require 'fileutils'
class WidgetGeneratorWorker
  include Sidekiq::Worker

  def perform(client_id, widget_config, icon_url, widget_request_id)
    config = widget_config

    parsed_config = JSON.parse(config)
    theme = parsed_config["theme"]
    color = parsed_config["color"]
    app_name = parsed_config["text"]["main"]


    dest_folder_name = "tmp/widget-#{Time.now.to_i}-#{rand(1000)}"
    FileUtils::mkdir_p dest_folder_name

    download = open(icon_url)
    IO.copy_stream(download, "#{dest_folder_name}/app_icon.png")

    system("png2icons #{dest_folder_name}/app_icon.png #{dest_folder_name}/app_icon -icns") 

    FileUtils::cp_r "widget/media", dest_folder_name
    FileUtils::cp_r "widget/css", dest_folder_name
    FileUtils::cp_r "widget/data", dest_folder_name
    FileUtils::cp_r "widget/icons", dest_folder_name
    FileUtils::cp_r "widget/js", dest_folder_name
    FileUtils::cp_r "widget/lib", dest_folder_name
    FileUtils::cp_r "widget/mimetype", dest_folder_name
    FileUtils::cp_r "widget/phone.html", dest_folder_name
    FileUtils::cp_r "widget/themes", dest_folder_name

    FileUtils::cp_r "widget/index.html", dest_folder_name
    FileUtils::cp_r "widget/main.js", dest_folder_name
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
      system("npm run installer-mac")
    end

    DesktopWidget.create(
      app: File.new("#{dest_folder_name}/#{app_name.gsub(" ","")}.dmg"), 
      app_name: app_name, 
      version: parsed_config["version"],
      client_id: client_id,
      widget_generation_request_id: widget_request_id
    )
  end
end
