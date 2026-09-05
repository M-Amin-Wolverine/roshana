class PreferencesController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PreferencesController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PreferencesController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'PreferencesController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PreferencesController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'PreferencesController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new PreferencesController();
