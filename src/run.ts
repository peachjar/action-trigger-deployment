import { GitHub } from '@actions/github'
import { Context } from '@actions/github/lib/context'

interface GitHubRepository {
    owner: string,
    repo: string,
}

export default async function run(
    context: Context,
    GitHub: { new(token: string): GitHub },
    core: {
        getInput: (key: string, opts?: { required: boolean }) => string
        setOutput: (name: string, value: string) => void
        info: (...args: any[]) => void
        setFailed: (message: string) => void
        [k: string]: any
    }
): Promise<void> {
    try {
        const token = core.getInput('token', { required: true })

        const environment = core.getInput('environment', { required: true })

        const required_contexts = (core.getInput('requiredContexts') || '')
            .split(',')
            .map(rc => rc.trim())
            .filter(Boolean)

        const description =
            core.getInput('description') || 'Deployed as a result of a code change'

        // Default to current repo, but if provided, trigger deployment on another
        let deployRepo: GitHubRepository = context.repo
        const deployRepoParam = core.getInput('repository')
        if (deployRepoParam !== '') {
            const [ owner, repo ] = deployRepoParam.split('/')
            deployRepo = {
                owner,
                repo,
            }
        }

        // If provided, parse provided JSON payload metadata
        const payloadParam = core.getInput('payload')
        const payload = payloadParam !== '' ?
            { payload: JSON.parse(payloadParam) } :
            null

        const octokit = new GitHub(token)

        const deployment = await octokit.repos.createDeployment(
            Object.assign(
                {
                    ref: context.ref,
                    environment,
                    required_contexts,
                    description
                },
                deployRepo,
                payload,
            )
        )

        core.info(`Deployment created: ${deployment.data.id}`)

        core.setOutput('deployment_id', `${deployment.data.id}`)
    } catch (error) {
        core.setFailed(error.message)
    }
}
