import * as core from '@actions/core'
import * as github from '@actions/github'

import run from './run'

run(github.context, github.GitHub, core)
