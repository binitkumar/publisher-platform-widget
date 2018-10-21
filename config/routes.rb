Rails.application.routes.draw do
  resources :widget_generation_requests
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: "widget_generation_requests#index"
end
