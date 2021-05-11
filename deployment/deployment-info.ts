export interface DeploymentInfo {
    network: {
        name: string,
        chainId: number
    },
    account: string,
    exchangeAddress: string
}

export function deployment(): DeploymentInfo {
    return require('../deployment.json')
}
