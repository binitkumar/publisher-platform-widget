class AddAttachmentAppToDesktopWidgets < ActiveRecord::Migration
  def self.up
    change_table :desktop_widgets do |t|
      t.attachment :app
    end
  end

  def self.down
    remove_attachment :desktop_widgets, :app
  end
end
