class AddIconUrlToWidgetGenerationRequest < ActiveRecord::Migration[5.0]
  def change
    add_column :widget_generation_requests, :icon_url, :text
  end
end
