class TokenController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'TokenController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'TokenController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'TokenController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'TokenController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'TokenController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new TokenController();


module.exports = {
    index,
    show,
    create,
    update,
    delete
};
