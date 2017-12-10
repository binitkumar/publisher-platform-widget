class AddWidgetGenerationRequestIdToDesktopWidget < ActiveRecord::Migration[5.0]
  def change
    add_column :desktop_widgets, :widget_generation_request_id, :integer
  end
end
