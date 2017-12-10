class AddAppNameToDesktopWidget < ActiveRecord::Migration[5.0]
  def change
    add_column :desktop_widgets, :app_name, :string
  end
end
