import { GitHub } from '@actions/github'
import { Context } from '@actions/github/lib/context'

import run from '../src/run'

describe('Run function', () => {
    let context: Context
    let GitHub: { new(token: string): GitHub }
    let core: {
        getInput: (key: string, opts?: { required: boolean }) => string
        setOutput: (name: string, value: string) => void
        info: (...args: any[]) => void
        setFailed: (message: string) => void
        [k: string]: any
    }
    let createDeploymentMock: jest.Mock

    beforeEach(() => {
        context = ({
            ref: 'abcdef1',
            repo: { owner: 'peachjar', repo: 'foobaz' }
        } as any) as Context
        createDeploymentMock = jest.fn(() =>
            Promise.resolve({
                data: {
                    id: 1234567890
                }
            })
        )
        GitHub = (class {
            constructor(token: string) {
            }

            repos = {
                createDeployment: createDeploymentMock
            }
        } as any) as { new(token: string): GitHub }
        core = {
            getInput: jest.fn((key: string) => {
                switch (key) {
                    case 'token':
                        return 'footoken'
                    case 'environment':
                        return 'staging'
                    case 'requiredContexts':
                        return 'build,build-migrations'
                    case 'description':
                        return 'Deployed as a result of a code change'
                    case 'repository':
                        // '' = optional property not set
                        return ''
                    case 'payload':
                        return ''
                    default:
                        throw Error('Unknown property being accessed')
                }
            }),
            setOutput: jest.fn(),
            info: jest.fn(),
            setFailed: jest.fn()
        }
    })

    describe('when a deployment is requested', () => {
        it('should call Github to create a deployment object', async () => {
            await run(context, GitHub, core)
            expect(createDeploymentMock).toHaveBeenCalledWith({
                owner: 'peachjar',
                repo: 'foobaz',
                ref: 'abcdef1',
                environment: 'staging',
                required_contexts: ['build', 'build-migrations'],
                description: 'Deployed as a result of a code change'
            })
            expect(core.info).toHaveBeenCalled()
            expect(core.setFailed).not.toHaveBeenCalled()
            expect(core.setOutput).toHaveBeenCalledWith('deployment_id', '1234567890')
        })

        describe('when required contexts is empty', () => {
            beforeEach(() => {
                core.getInput = jest.fn((key: string) => {
                    switch (key) {
                        case 'token':
                            return 'footoken'
                        case 'environment':
                            return 'staging'
                        case 'requiredContexts':
                            return ''
                        case 'description':
                            return 'Deployed as a result of a code change'
                        case 'repository':
                            // '' = optional property not set
                            return ''
                        case 'payload':
                            return ''
                        default:
                            throw Error('Unknown property being accessed')
                    }
                })
            })

            it('should use an empty array if required_contexts are not wanted', async () => {
                await run(context, GitHub, core)

                expect(createDeploymentMock).toHaveBeenCalledWith({
                    owner: 'peachjar',
                    repo: 'foobaz',
                    ref: 'abcdef1',
                    environment: 'staging',
                    required_contexts: [],
                    description: 'Deployed as a result of a code change'
                })
                expect(core.info).toHaveBeenCalled()
                expect(core.setFailed).not.toHaveBeenCalled()
                expect(core.setOutput).toHaveBeenCalledWith('deployment_id', '1234567890')
            })
        })

        describe('when repository parameter is provided', () => {
            beforeEach(() => {
                core.getInput = jest.fn((key: string) => {
                    switch (key) {
                        case 'token':
                            return 'footoken'
                        case 'environment':
                            return 'staging'
                        case 'requiredContexts':
                            return 'build,build-migrations'
                        case 'description':
                            return 'Deployed as a result of a code change'
                        case 'repository':
                            return '3rdparty/some-external-repo'
                        case 'payload':
                            return ''
                        default:
                            throw Error('Unknown property being accessed')
                    }
                })
            })

            it('should call Github to create a deployment object', async () => {
                await run(context, GitHub, core)
                expect(createDeploymentMock).toHaveBeenCalledWith({
                    owner: '3rdparty',
                    repo: 'some-external-repo',
                    ref: 'abcdef1',
                    environment: 'staging',
                    required_contexts: ['build', 'build-migrations'],
                    description: 'Deployed as a result of a code change'
                })
                expect(core.info).toHaveBeenCalled()
                expect(core.setFailed).not.toHaveBeenCalled()
                expect(core.setOutput).toHaveBeenCalledWith('deployment_id', '1234567890')
            })

        })

        describe('when payload parameter is provided', () => {
            beforeEach(() => {
                core.getInput = jest.fn((key: string) => {
                    switch (key) {
                        case 'token':
                            return 'footoken'
                        case 'environment':
                            return 'staging'
                        case 'requiredContexts':
                            return 'build,build-migrations'
                        case 'description':
                            return 'Deployed as a result of a code change'
                        case 'repository':
                            return '3rdparty/some-external-repo'
                        case 'payload':
                            return '{"hello": "world"}'
                        default:
                            throw Error('Unknown property being accessed')
                    }
                })
            })

            it('should call Github to create a deployment object', async () => {
                await run(context, GitHub, core)
                expect(createDeploymentMock).toHaveBeenCalledWith({
                    owner: '3rdparty',
                    repo: 'some-external-repo',
                    ref: 'abcdef1',
                    environment: 'staging',
                    required_contexts: ['build', 'build-migrations'],
                    description: 'Deployed as a result of a code change',
                    payload: { hello: 'world' },
                })
                expect(core.info).toHaveBeenCalled()
                expect(core.setFailed).not.toHaveBeenCalled()
                expect(core.setOutput).toHaveBeenCalledWith('deployment_id', '1234567890')
            })
        })
    })

    describe('when the request to create a deployment fails', () => {
        const error = new Error('Kaboom!')

        beforeEach(() => {
            createDeploymentMock = jest.fn(() => Promise.reject(error))
        })

        it('should fail the action', async () => {
            await run(context, GitHub, core)
            expect(createDeploymentMock).toHaveBeenCalledWith({
                owner: 'peachjar',
                repo: 'foobaz',
                ref: 'abcdef1',
                environment: 'staging',
                required_contexts: ['build', 'build-migrations'],
                description: 'Deployed as a result of a code change'
            })
            expect(core.info).not.toHaveBeenCalled()
            expect(core.setFailed).toHaveBeenCalledWith(error.message)
            expect(core.setOutput).not.toHaveBeenCalled()
        })
    })
})
