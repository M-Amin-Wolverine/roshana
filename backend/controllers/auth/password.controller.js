class PasswordController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PasswordController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PasswordController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'PasswordController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PasswordController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PasswordController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new PasswordController();


module.exports = {
    index,
    show,
    create,
    update,
    delete
};
