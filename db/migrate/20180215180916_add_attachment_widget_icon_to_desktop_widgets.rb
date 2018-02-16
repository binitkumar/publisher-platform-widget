class AddAttachmentWidgetIconToDesktopWidgets < ActiveRecord::Migration
  def self.up
    change_table :desktop_widgets do |t|
      t.attachment :widget_icon
    end
  end

  def self.down
    remove_attachment :desktop_widgets, :widget_icon
  end
end
