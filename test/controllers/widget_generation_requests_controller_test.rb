require 'test_helper'

class WidgetGenerationRequestsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @widget_generation_request = widget_generation_requests(:one)
  end

  test "should get index" do
    get widget_generation_requests_url
    assert_response :success
  end

  test "should get new" do
    get new_widget_generation_request_url
    assert_response :success
  end

  test "should create widget_generation_request" do
    assert_difference('WidgetGenerationRequest.count') do
      post widget_generation_requests_url, params: { widget_generation_request: { client_id: @widget_generation_request.client_id, params: @widget_generation_request.params, status: @widget_generation_request.status } }
    end

    assert_redirected_to widget_generation_request_url(WidgetGenerationRequest.last)
  end

  test "should show widget_generation_request" do
    get widget_generation_request_url(@widget_generation_request)
    assert_response :success
  end

  test "should get edit" do
    get edit_widget_generation_request_url(@widget_generation_request)
    assert_response :success
  end

  test "should update widget_generation_request" do
    patch widget_generation_request_url(@widget_generation_request), params: { widget_generation_request: { client_id: @widget_generation_request.client_id, params: @widget_generation_request.params, status: @widget_generation_request.status } }
    assert_redirected_to widget_generation_request_url(@widget_generation_request)
  end

  test "should destroy widget_generation_request" do
    assert_difference('WidgetGenerationRequest.count', -1) do
      delete widget_generation_request_url(@widget_generation_request)
    end

    assert_redirected_to widget_generation_requests_url
  end
end
