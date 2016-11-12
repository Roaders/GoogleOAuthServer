
# Deploying a Node and Browser Typescript Project to Heroku #

For a while I have wanted to find a host provider for my very small node apps that I want to create. Most of these apps will probably only be used by me so they will have very very low traffic. What I was lookign for:

 - low cost or free
 - support for node.js
 - git push to deploy
 
 It seems that Heroku meets all these criteria and so far I am extremely pleased with the service that they provide.
 
 ##Cost##
 
Heroku have a number of different pricing plans that go all the way up to enterprise level. 

For me the 2 most important ones were Free and Hobby. Free does everything that I want due to my very low traffic requirements. It's only downside is that your dyno (their word for your app instance) sleeps after 30 minutes so the first request has to wait for around 10 seconds for your dyno to wake up. This is a minor annoyance but can be avoided by upgrading to the hobby plan which costs $7 a month. On the hobby plan you get a few advantages including dynos that never sleep.

The free plan only has a certain number of hours available a month but the allowance will be plenty for me.

There are ways round the sleeping dyno problem but I am not sure that I want to use them as I don't really want to abuse a free service. I'll see how it goes and consider how annoying this wait is.

##Deploying New Code to Heroku##

You can do a new deploy on Heroku a few different ways:

- manually
- by pushing to a specified branch on GitHub
- by pushing directly to Heroku

Initially I tried the branch method but I found managing the extra branch a bit of a pain. It's much easier to configure Heroku as an additional remote in git and then just pushing to this remote when I want to deploy.

`git push heroku master`

is all I need to do to deploy my app.

##Compiling Typescript on Heroku##

I don't commit my compiled javascript to git. I commit my typescript source files and compile them locally. When we push new changes to the Heroku git remote we will need them to be compiled.

When your app is deployed on Heroku it runs `npm install` in a subshell where `NODE_ENV` is `production`. This means that dev dependencies are not resolved and that the `prepublish` npm script is not run. You can test this by running `npm install --production`

This means a couple of things:

- we have to include `devDepenedencies` such as typescript and any build tools in the normal dependency list
- we have to hook up the `postinstall` npm script to build out app.

As a result of this I have created a number of scripts in my `package.json` that will build my app. My `postinstall` script is simply `npm run typings && npm run compile` which will call 2 custom scripts that I created that will install any typings that I require and then build my typescript. Any grunt or gulp builds could be called here instead.

###Other Concerns###

There are a few other things that you should do to make sure that your app is properly compiled. A good example is setting the node version and npm version that you are using, again in your `package.json` file:
```
  "engines": {
    "node": "6.9.1",
    "npm": "3.10.8"
  }
```
