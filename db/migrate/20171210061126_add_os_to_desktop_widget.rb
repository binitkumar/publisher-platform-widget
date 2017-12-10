class AddOsToDesktopWidget < ActiveRecord::Migration[5.0]
  def change
    add_column :desktop_widgets, :os, :string
  end
end
