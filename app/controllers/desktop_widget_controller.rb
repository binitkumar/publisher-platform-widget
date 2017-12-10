class DesktopWidgetController < ApplicationController

  def index
    @widgets = DesktopWidget.all.order("created_at desc")
  end
end
