class ClassroomController {
    async index(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ClassroomController',
            action: 'index'
        });
    }

    async show(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ClassroomController',
            action: 'show',
            id: req.params.id
        });
    }

    async create(req, res) {
        return res.status(201).json({
            success: true,
            controller: 'ClassroomController',
            action: 'create',
            data: req.body
        });
    }

    async update(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ClassroomController',
            action: 'update',
            id: req.params.id,
            data: req.body
        });
    }

    async delete(req, res) {
        return res.status(200).json({
            success: true,
            controller: 'ClassroomController',
            action: 'delete',
            id: req.params.id
        });
    }
}

module.exports = new ClassroomController();
