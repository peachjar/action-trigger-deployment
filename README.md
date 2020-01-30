<p align="center">
  <a href="https://github.com/peachjar/action-trigger-deployment/actions"><img alt="typescript-action status" src="https://github.com/peachjar/action-trigger-deployment/workflows/build-test/badge.svg"></a>
</p>

# Github Action: Trigger Deployment for Current Repository

Create a Github deployment object associated to the repository the action is executed in.  This allows other Github Actions (or external tools) to listen for the event and being a deployment.

## Usage

```
uses: peachjar/action-trigger-deployment@v1
with:
  token: ${{ secrets.GITHUB_DEPLOY_TOKEN }}
  environment: staging
  description: Deploy on successful push to master
```

When using with Github actions, you may need to specify `requiredContexts`, which are verification steps registered with the repository that must succeed before a deployment:

```
uses: peachjar/action-trigger-deployment@v1
with:
  token: ${{ secrets.GITHUB_DEPLOY_TOKEN }}
  environment: staging
  description: Deploy on successful push to master
  requiredContexts: build,build-migrations
```

`build,build-migrations` are the default, used by us at Peachjar.
