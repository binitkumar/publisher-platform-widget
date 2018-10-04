class AddAttachmentWindowsAppToDesktopWidgets < ActiveRecord::Migration[5.0]
  def self.up
    change_table :desktop_widgets do |t|
      t.attachment :windows_app
    end
  end

  def self.down
    remove_attachment :desktop_widgets, :windows_app
  end
end
