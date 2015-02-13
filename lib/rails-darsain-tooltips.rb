require "rails-darsain-tooltips/version"

module DarsainTooltipsRails
  if defined? ::Rails::Engine
    require "rails-darsain-tooltips/engine"
  else
    puts "You should use Rails 3.1+ and higher with rails-darsain-tooltips!"
  end
end
