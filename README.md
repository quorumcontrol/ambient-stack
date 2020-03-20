# The Ambient Stack

This is the alpha release of the [Ambient Stack](https://ambientstack.org/). 

## Repo Structure

This is a mono-repo. [ambient-stack](./packages/ambient-stack) is the underlying library for user management and synced databases using Tupelo. [ambient-react](./packages/ambient-react) is a set of hooks that can be used in your react apps to make integrating ambient easier. There's also a [demo](./demo) react application showing how to use the [ambient-react](./packages/ambient-react) package.

## Local Tupelo

Right now everything is pointing at a local Tupelo... you can start a local Tupelo with `docker-compose up` in the root of this repo.

## Running the Demo

`docker-compose up`
and in another tab:
`cd demo && npm start`

That should open up localhost:3000 in your browser and you can login. Killing and restarting the docker container will clear any state of the app.

