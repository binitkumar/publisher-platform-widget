class WidgetGenerationRequest < ApplicationRecord

  after_create :schedule_widget_generation

  def schedule_widget_generation
    WidgetGeneratorWorker.perform_async(self.client_id, self.params, self.icon_url, self.id)
  end
end
