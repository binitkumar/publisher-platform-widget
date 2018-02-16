# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180215180916) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "desktop_widgets", force: :cascade do |t|
    t.integer  "client_id"
    t.string   "version"
    t.datetime "created_at",                   null: false
    t.datetime "updated_at",                   null: false
    t.string   "os"
    t.string   "app_file_name"
    t.string   "app_content_type"
    t.integer  "app_file_size"
    t.datetime "app_updated_at"
    t.string   "app_name"
    t.integer  "widget_generation_request_id"
    t.string   "widget_icon_file_name"
    t.string   "widget_icon_content_type"
    t.integer  "widget_icon_file_size"
    t.datetime "widget_icon_updated_at"
  end

  create_table "widget_generation_requests", force: :cascade do |t|
    t.text     "params"
    t.integer  "client_id"
    t.string   "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text     "icon_url"
  end

end
