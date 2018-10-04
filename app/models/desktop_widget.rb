class DesktopWidget < ApplicationRecord
  has_attached_file :app
  do_not_validate_attachment_file_type :app
  has_attached_file :windows_app
  do_not_validate_attachment_file_type :windows_app
  has_attached_file :linux_app
  do_not_validate_attachment_file_type :linux_app

  has_attached_file :widget_icon
  do_not_validate_attachment_file_type :widget_icon
end
