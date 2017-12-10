class DesktopWidget < ApplicationRecord
  has_attached_file :app
  validates_attachment_content_type :app, content_type: [ /\Aapplication\/.*\Z/ ]
end
