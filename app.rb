require 'sinatra'
require 'sinatra/partial'
require 'sinatra/reloader' if development?
require 'cgi'

require 'redis'

configure do
  redisUri = ENV["REDISTOGO_URL"] || 'redis://localhost:6379'
  uri = URI.parse(redisUri) 
  $redis = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
end

get '/' do
  redirect '/channel/chrisallick'
end

get %r{/channel/([\w]+)} do
  erb :main
end

get '/vids' do
  channel = params[:channel]
  puts channel
  vids = []
  all = $redis.lrange("vids:#{channel}", 0, $redis.llen("vids:#{channel}"))
  all.each do |vid|
    vids.push( vid )
  end
  { :result => "success", :vids => vids }.to_json
end

post '/addvid' do
  url = params[:url]
  channel = params[:channel]

  puts url
  puts channel

  if url && channel
    params = CGI.parse(URI.parse(url).query)
    puts params
  
    if params.include? "v"
      puts params["v"]
      $redis.lpush( "vids:#{channel}", params["v"] )
      { :result => "success", :vid => params["v"][0] }.to_json
    else
      { :result => "fail", :msg => "video id not found" }.to_json
    end
  else
    { :result => "fail", :msg => "invalid params" }.to_json
  end
end

post '/deletevid' do
  vid = params[:vid]
  channel = params[:channel]

  if vid && channel
    $redis.lrem("vids:#{channel}",0,vid)

    { :result => "success" }.to_json
  else
    { :result => "fail" }.to_json
  end

end