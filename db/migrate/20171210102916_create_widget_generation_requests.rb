class CreateWidgetGenerationRequests < ActiveRecord::Migration[5.0]
  def change
    create_table :widget_generation_requests do |t|
      t.text :params
      t.integer :client_id
      t.string :status

      t.timestamps
    end
  end
end
