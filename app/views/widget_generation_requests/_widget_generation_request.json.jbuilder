json.extract! widget_generation_request, :id, :params, :client_id, :status, :created_at, :updated_at
json.url widget_generation_request_url(widget_generation_request, format: :json)
