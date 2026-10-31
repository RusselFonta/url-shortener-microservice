export const checkController = {
    getHealth: (_req, res) => {
        res.status(200).json({
            status:'success',
            message: 'the server is healthty',
            timestamp: new Date().toISOString(),
        })
    }
}