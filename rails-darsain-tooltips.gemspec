# -*- encoding: utf-8 -*-
require File.expand_path("../lib/rails-darsain-tooltips/version", __FILE__)

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name      = "rails-darsain-tooltips"
  s.version   = DarsainTooltipsRails::VERSION
  s.date			=  Time.new.strftime("%Y-%m-%d")
  s.summary   = "Darsain's Tooltips on Rails"
  s.description = "Injects Darsain's Tooltips into your asset pipeline."
  s.authors   = ["Alexander Bobrov"]
  s.email     = "alexander@devvela.com"
  s.files     = Dir["{lib,vendor}/**/*"] + ["MIT-LICENSE", "README.md"]
  s.homepage  = "https://github.com/alexkpek/rails-darsain-tooltips"
  s.license   = "MIT"
end
