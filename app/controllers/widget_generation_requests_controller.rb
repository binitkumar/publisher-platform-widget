class WidgetGenerationRequestsController < ApplicationController
  before_action :set_widget_generation_request, only: [:show, :edit, :update, :destroy]
  protect_from_forgery except: [ :create ]
  def index
    @widget_generation_requests = WidgetGenerationRequest.all
  end

  def show
  end


  def create
    @widget_generation_request = WidgetGenerationRequest.new(widget_generation_request_params)

    respond_to do |format|
      if @widget_generation_request.save
        
        format.html { redirect_to @widget_generation_request, notice: 'Widget generation request was successfully created.' }
        format.json { render :show, status: :created, location: @widget_generation_request }
      else
        format.html { render :new }
        format.json { render json: @widget_generation_request.errors, status: :unprocessable_entity }
      end
    end
  end

  private
    def set_widget_generation_request
      @widget_generation_request = WidgetGenerationRequest.find(params[:id])
    end

    def widget_generation_request_params
      { 
        params: params[:params],
        client_id: params[:client_id],
        icon_url: params[:icon_url]
      }
    end
end
