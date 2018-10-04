class AddAttachmentLinuxAppToDesktopWidgets < ActiveRecord::Migration[5.0]
  def self.up
    change_table :desktop_widgets do |t|
      t.attachment :linux_app
    end
  end

  def self.down
    remove_attachment :desktop_widgets, :linux_app
  end
end
