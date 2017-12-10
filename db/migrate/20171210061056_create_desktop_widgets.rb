class CreateDesktopWidgets < ActiveRecord::Migration[5.0]
  def change
    create_table :desktop_widgets do |t|
      t.integer :client_id
      t.string :version

      t.timestamps
    end
  end
end
