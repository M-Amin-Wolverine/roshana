
async function listUsers(data) {
    try {

        // TODO: Implement listUsers

    } catch (error) {
        throw error;
    }
}

async function searchUsers(data) {
    try {

        // TODO: Implement searchUsers

    } catch (error) {
        throw error;
    }
}

async function getUserById(data) {
    try {

        // TODO: Implement getUserById

    } catch (error) {
        throw error;
    }
}

async function createUser(data) {
    try {

        // TODO: Implement createUser

    } catch (error) {
        throw error;
    }
}

async function updateUser(data) {
    try {

        // TODO: Implement updateUser

    } catch (error) {
        throw error;
    }
}

async function deleteUser(data) {
    try {

        // TODO: Implement deleteUser

    } catch (error) {
        throw error;
    }
}

async function toggleStatus(data) {
    try {

        // TODO: Implement toggleStatus

    } catch (error) {
        throw error;
    }
}

async function suspendUser(data) {
    try {

        // TODO: Implement suspendUser

    } catch (error) {
        throw error;
    }
}

async function unsuspendUser(data) {
    try {

        // TODO: Implement unsuspendUser

    } catch (error) {
        throw error;
    }
}

async function bulkAction(data) {
    try {

        // TODO: Implement bulkAction

    } catch (error) {
        throw error;
    }
}

async function bulkImport(data) {
    try {

        // TODO: Implement bulkImport

    } catch (error) {
        throw error;
    }
}

async function bulkUpdate(data) {
    try {

        // TODO: Implement bulkUpdate

    } catch (error) {
        throw error;
    }
}

async function bulkDelete(data) {
    try {

        // TODO: Implement bulkDelete

    } catch (error) {
        throw error;
    }
}

async function verifyEmail(data) {
    try {

        // TODO: Implement verifyEmail

    } catch (error) {
        throw error;
    }
}

async function verifyPhone(data) {
    try {

        // TODO: Implement verifyPhone

    } catch (error) {
        throw error;
    }
}

async function createValidationRule(data) {
    try {

        // TODO: Implement createValidationRule

    } catch (error) {
        throw error;
    }
}

async function getValidationRules(data) {
    try {

        // TODO: Implement getValidationRules

    } catch (error) {
        throw error;
    }
}





async getAllUsers(req, res) {
        const startTime = Date.now();
        try {
            const { page = 1, limit = 20, role, status: userStatus, search, sortBy = 'created_at', sortOrder = 'DESC', startDate, endDate, isVerified, isActive, fields = 'basic', export: isExport } = req.query;

            // اعتبارسنجی پارامترها
            const validation = validator.validate(req.query, {
                page: { type: 'number', min: 1, max: 1000 },
                limit: { type: 'number', min: 1, max: 100 },
                role: { type: 'enum', values: ['admin', 'manager', 'user', 'guest'] },
                isActive: { type: 'boolean' },
                isVerified: { type: 'boolean' },
                sortOrder: { type: 'enum', values: ['ASC', 'DESC'] }
            });

            if (!validation.isValid) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.VALIDATION_ERROR, validation.errors)
                );
            }

            const offset = (page - 1) * limit;
            const validSortFields = ['id', 'username', 'email', 'created_at', 'updated_at', 'last_login', 'role', 'is_active'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // ساخت کوئری پیچیده
            const { query, params, countQuery, countParams } = this.buildUserQuery({
                role,
                isActive,
                isVerified,
                userStatus,
                search,
                startDate,
                endDate,
                sortField,
                order,
                limit: parseInt(limit),
                offset
            });

            // اجرای کوئری‌ها
            const [users] = await User.db.query(query, params);
            const [countResult] = await User.db.query(countQuery, countParams);
            const total = countResult[0].total;

            // لاگ کوئری
            databaseLogger.logQuery(query, Date.now() - startTime, {
                duration: Date.now() - startTime,
                rows: users.length
            });

            // فیلتر فیلدهای خروجی
            const filteredUsers = this.filterUserFields(users, fields);

            // خروجی برای export
            if (isExport === 'true') {
                return this.exportUsers(res, filteredUsers, req.query.format || 'json');
            }

            logger.info(`Users fetched: page=${page}, limit=${limit}, total=${total}`, {
                adminId: req.user?.id,
                duration: Date.now() - startTime
            });

            return res.status(status.OK).json(
                paginatedResponse(messages.USERS_FETCHED, filteredUsers, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit),
                    sortBy: sortField,
                    sortOrder: order
                })
            );
        } catch (error) {
            logger.errorWithStack('Get All Users Error', error, {
                query: req.query,
                adminId: req.user?.id
            });
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📊 آمار و داشبورد کاربران
    // ═══════════════════════════════════════════════════════════════════
    /**
     * دریافت آمار جامع کاربران
     * @route GET /api/v1/users/stats
     * @access Private (Admin)
     */
    async getUserStats(req, res) {
        const startTime = Date.now();
        try {
            const { period = '30d', groupBy = 'day' } = req.query;

            // اعتبارسنجی period
            const validPeriods = ['7d', '30d', '90d', '1y', 'all'];
            if (!validPeriods.includes(period)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Period معتبر نیست')
                );
            }

            // محاسبه تاریخ
            const dateFilter = this.getDateFilter(period);

            // کوئری‌های آماری موازی
            const [
                totalUsers,
                activeUsers,
                verifiedUsers,
                suspendedUsers,
                roleStats,
                newUsers,
                activeInPeriod,
                dailyRegistrations,
                topActiveUsers,
                usersByCountry,
                usersByDevice,
                loginStats
            ] = await Promise.all([
                // آمار کلی
                User.db.query('SELECT COUNT(*) as count FROM users'),
                User.db.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND is_suspended = 0'),
                User.db.query('SELECT COUNT(*) as count FROM users WHERE is_verified = 1'),
                User.db.query('SELECT COUNT(*) as count FROM users WHERE is_suspended = 1'),
                // آمار نقش‌ها
                User.db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
                // کاربران جدید
                User.db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= ?', [dateFilter]),
                // کاربران فعال
                User.db.query('SELECT COUNT(*) as count FROM users WHERE last_login >= ?', [dateFilter]),
                // ثبت‌نام روزانه
                this.getDailyRegistrations(period),
                // کاربران فعال
                User.db.query(`
                    SELECT id, username, email, first_name, last_name, avatar, last_login, created_at
                    FROM users
                    WHERE last_login IS NOT NULL
                    ORDER BY last_login DESC
                    LIMIT 10
                `),
                // آمار کشور (شبیه‌سازی)
                User.db.query('SELECT country, COUNT(*) as count FROM users GROUP BY country'),
                // آمار دستگاه
                User.db.query('SELECT device_type, COUNT(*) as count FROM users GROUP BY device_type'),
                // آمار ورود
                User.db.query(`
                    SELECT DATE(last_login) as date, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
                    FROM user_logins
                    WHERE last_login >= ?
                    GROUP BY DATE(last_login)
                    ORDER BY date DESC
                    LIMIT 30
                `, [dateFilter])
            ]);

            // محاسبه درصدها
            const total = totalUsers[0][0].count;
            const stats = {
                overview: {
                    total: total,
                    active: activeUsers[0][0].count,
                    activePercent: total > 0 ? ((activeUsers[0][0].count / total) * 100).toFixed(2) : 0,
                    verified: verifiedUsers[0][0].count,
                    verifiedPercent: total > 0 ? ((verifiedUsers[0][0].count / total) * 100).toFixed(2) : 0,
                    suspended: suspendedUsers[0][0].count,
                    newInPeriod: newUsers[0][0].count,
                    activeInPeriod: activeInPeriod[0][0].count,
                    growthRate: total > 0 ? ((newUsers[0][0].count / total) * 100).toFixed(2) : 0
                },
                byRole: roleStats[0].reduce((acc, item) => {
                    acc[item.role] = {
                        count: item.count,
                        percent: total > 0 ? ((item.count / total) * 100).toFixed(2) : 0
                    };
                    return acc;
                }, {}),
                dailyRegistrations: dailyRegistrations[0],
                topActiveUsers: topActiveUsers[0],
                byCountry: usersByCountry[0],
                byDevice: usersByDevice[0],
                loginStats: loginStats[0],
                period,
                generatedAt: new Date().toISOString()
            };

            logger.info(`User stats fetched for period: ${period}`, {
                duration: Date.now() - startTime,
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse(messages.STATS_FETCHED, stats)
            );
        } catch (error) {
            logger.errorWithStack('Get User Stats Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔍 جستجوی پیشرفته کاربران
    // ═══════════════════════════════════════════════════════════════════
    /**
     * جستجوی پیشرفته با فیلترهای متنوع
     * @route GET /api/v1/users/search
     * @access Private (Admin)
     */
    async searchUsers(req, res) {
        try {
            const {
                q,
                page = 1,
                limit = 20,
                type = 'all', // all, username, email, phone, name
                exact = false,
                fields = 'basic'
            } = req.query;

            // اعتبارسنجی عبارت جستجو
            if (!q || q.trim().length < 2) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('عبارت جستجو باید حداقل ۲ کاراکتر باشد')
                );
            }

            const offset = (page - 1) * limit;
            const searchPattern = exact ? q.trim() : `%${q.trim()}%`;

            // ساخت شرط‌های جستجو بر اساس type
            let searchConditions = [];
            switch (type) {
                case 'username':
                    searchConditions = ['username LIKE ?'];
                    break;
                case 'email':
                    searchConditions = ['email LIKE ?'];
                    break;
                case 'phone':
                    searchConditions = ['phone LIKE ?'];
                    break;
                case 'name':
                    searchConditions = ['first_name LIKE ?', 'last_name LIKE ?'];
                    break;
                default:
                    searchConditions = [
                        'username LIKE ?',
                        'email LIKE ?',
                        'phone LIKE ?',
                        'first_name LIKE ?',
                        'last_name LIKE ?'
                    ];
            }

            const searchParams = exact ? [q.trim()] : Array(searchConditions.length).fill(searchPattern);

            const query = `
                SELECT id, username, email, first_name, last_name, phone, role, avatar, is_active, is_verified, created_at, last_login
                FROM users
                WHERE ${searchConditions.join(' OR ')}
                ORDER BY
                    CASE WHEN username = ? THEN 1
                         WHEN email = ? THEN 2
                         ELSE 3
                    END,
                    created_at DESC
                LIMIT ? OFFSET ?
            `;

            const params = [...searchParams, q.trim(), q.trim(), parseInt(limit), offset];
            const [users] = await User.db.query(query, params);

            // شمارش نتایج
            const countQuery = `
                SELECT COUNT(*) as total
                FROM users
                WHERE ${searchConditions.join(' OR ')}
            `;
            const [countResult] = await User.db.query(countQuery, searchParams);

            logger.info(`User search: "${q}", found: ${countResult[0].total}`, {
                type,
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                paginatedResponse(messages.USERS_FETCHED, users, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit),
                    searchTerm: q,
                    searchType: type
                })
            );
        } catch (error) {
            logger.errorWithStack('Search Users Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📥 دریافت کاربر با آیدی
    // ═══════════════════════════════════════════════════════════════════
    /**
     * دریافت اطلاعات کاربر با جزئیات مختلف
     * @route GET /api/v1/users/:id
     * @access Private (Admin)
     */
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const { fields = 'basic', include = '' } = req.query;

            // بررسی کش
            const cacheKey = `${this.cachePrefix}${id}:${fields}:${include}`;
            const cached = await cache.get(cacheKey);
            if (cached) {
                logger.debug(`User ${id} fetched from cache`);
                return res.status(status.OK).json(
                    successResponse(messages.USER_FETCHED, cached)
                );
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // ساخت داده‌ها بر اساس level
            let userData = this.buildUserData(user, fields);

            // شامل اطلاعات اضافی
            if (include) {
                const includes = include.split(',');
                if (includes.includes('stats')) {
                    userData.stats = await this.getUserDetailedStats(id);
                }
                if (includes.includes('activity')) {
                    userData.recentActivity = await this.getUserRecentActivity(id, 10);
                }
                if (includes.includes('sessions')) {
                    userData.activeSessions = await this.getUserActiveSessions(id);
                }
                if (includes.includes('devices')) {
                    userData.devices = await this.getUserDevices(id);
                }
                if (includes.includes('permissions')) {
                    userData.permissions = await this.getUserPermissions(id);
                }
            }

            // کش کردن نتیجه
            await cache.set(cacheKey, userData, this.cacheTTL);

            logger.info(`User fetched: ID=${id}, fields=${fields}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse(messages.USER_FETCHED, userData)
            );
        } catch (error) {
            logger.errorWithStack('Get User By ID Error', error, {
                userId: req.params.id
            });
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ➕ ایجاد کاربر جدید
    // ═══════════════════════════════════════════════════════════════════
    /**
     * ایجاد کاربر جدید با اعتبارسنجی کامل
     * @route POST /api/v1/users
     * @access Private (Admin)
     */
    async createUser(req, res) {
        const startTime = Date.now();
        try {
            const {
                username,
                email,
                password,
                first_name,
                last_name,
                phone,
                role = 'user',
                sendWelcomeEmail = true,
                sendSMS = false,
                requirePasswordChange = false,
                meta = {}
            } = req.body;

            // اعتبارسنجی اولیه
            const validation = validator.validate(req.body, {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    pattern: /^[a-zA-Z0-9_]+$/,
                    required: true
                },
                email: { type: 'email', required: true },
                password: { type: 'string', minLength: 8, maxLength: 128, required: true },
                phone: { type: 'phone' },
                role: { type: 'enum', values: ['admin', 'manager', 'user', 'guest'] }
            });

            if (!validation.isValid) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.VALIDATION_ERROR, validation.errors)
                );
            }

            // بررسی تکراری‌ها (موازی)
            const [existingEmail, existingUsername, existingPhone] = await Promise.all([
                User.findByEmail(email),
                User.findByUsername(username),
                phone ? User.findByPhone(phone) : Promise.resolve(null)
            ]);

            if (existingEmail) {
                return res.status(status.CONFLICT).json(
                    errorResponse(messages.EMAIL_ALREADY_EXISTS)
                );
            }

            if (existingUsername) {
                return res.status(status.CONFLICT).json(
                    errorResponse(messages.USERNAME_ALREADY_EXISTS)
                );
            }

            if (existingPhone) {
                return res.status(status.CONFLICT).json(
                    errorResponse(messages.PHONE_ALREADY_EXISTS)
                );
            }

            // بررسی قدرت رمز عبور
            const passwordStrength = this.checkPasswordStrength(password);
            if (passwordStrength.score < 3) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('رمز عبور ضعیف است', {
                        strength: passwordStrength,
                        suggestions: this.getPasswordSuggestions(password)
                    })
                );
            }

            // هش کردن رمز عبور
            const hashedPassword = await bcrypt.hash(password, config.SECURITY.BCRYPT.SALT_ROUNDS);

            // تولید توکن تایید
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعت

            // ایجاد کاربر
            const userId = await User.create({
                username,
                email,
                password: hashedPassword,
                first_name,
                last_name,
                phone,
                role: role.toLowerCase(),
                is_active: 1,
                is_verified: 0,
                verification_token: verificationToken,
                verification_token_expires: verificationTokenExpiry,
                force_password_change: requirePasswordChange ? 1 : 0,
                created_at: new Date(),
                created_by: req.user?.id,
                meta: JSON.stringify(meta)
            });

            // ارسال ایمیل خوش‌آمدگویی
            if (sendWelcomeEmail) {
                try {
                    await emailService.sendWelcomeEmail({
                        to: email,
                        username,
                        name: `${first_name || ''} ${last_name || ''}`.trim() || username,
                        verificationToken
                    });
                } catch (emailError) {
                    logger.warn('Failed to send welcome email', {
                        userId,
                        error: emailError.message
                    });
                }
            }

            // ارسال پیامک خوش‌آمدگویی
            if (sendSMS && phone) {
                try {
                    await smsService.sendWelcomeSMS({
                        phone,
                        username
                    });
                } catch (smsError) {
                    logger.warn('Failed to send welcome SMS', {
                        userId,
                        error: smsError.message
                    });
                }
            }

            // لاگ فعالیت
            logger.userAction(req.user?.id, 'CREATE_USER', {
                userId,
                username,
                email,
                role: role.toLowerCase(),
                duration: Date.now() - startTime
            });

            logger.info(`User created: ID=${userId}, username=${username}`, {
                adminId: req.user?.id,
                duration: Date.now() - startTime
            });

            return res.status(status.CREATED).json(
                successResponse(messages.USER_CREATED, {
                    id: userId,
                    username,
                    email,
                    role: role.toLowerCase(),
                    requiresVerification: !sendWelcomeEmail
                })
            );
        } catch (error) {
            logger.errorWithStack('Create User Error', error, {
                body: { ...req.body, password: '***' },
                adminId: req.user?.id
            });
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ✏️ آپدیت کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * آپدیت اطلاعات کاربر
     * @route PUT /api/v1/users/:id
     * @access Private (Admin)
     */
    async updateUser(req, res) {
        const startTime = Date.now();
        try {
            const { id } = req.params;
            const {
                first_name,
                last_name,
                phone,
                role,
                is_active,
                is_verified,
                bio,
                avatar,
                cover,
                settings,
                meta
            } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // بررسی تکراری شماره موبایل
            if (phone && phone !== user.phone) {
                const existingPhone = await User.findByPhone(phone);
                if (existingPhone && existingPhone.id !== parseInt(id)) {
                    return res.status(status.CONFLICT).json(
                        errorResponse(messages.PHONE_ALREADY_EXISTS)
                    );
                }
            }

            // بررسی معتبر بودن نقش
            if (role) {
                const validRoles = ['admin', 'manager', 'user', 'guest'];
                if (!validRoles.includes(role.toLowerCase())) {
                    return res.status(status.BAD_REQUEST).json(
                        errorResponse('نقش معتبر نیست')
                    );
                }
            }

            // ساخت داده‌های آپدیت
            const updateData = this.buildUpdateData({
                first_name,
                last_name,
                phone,
                role,
                is_active,
                is_verified,
                bio,
                avatar,
                cover,
                settings,
                meta
            });

            if (Object.keys(updateData).length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('هیچ فیلدی برای آپدیت ارسال نشده است')
                );
            }

            updateData.updated_at = new Date();
            updateData.updated_by = req.user?.id;

            await User.update(id, updateData);

            // پاک کردن کش
            await cache.del(`${this.cachePrefix}${id}*`);

            logger.info(`User updated: ID=${id}`, {
                fields: Object.keys(updateData),
                adminId: req.user?.id,
                duration: Date.now() - startTime
            });

            return res.status(status.OK).json(
                successResponse(messages.USER_UPDATED, {
                    id: parseInt(id),
                    updatedFields: Object.keys(updateData).filter(k => !['updated_at', 'updated_by'].includes(k))
                })
            );
        } catch (error) {
            logger.errorWithStack('Update User Error', error, {
                userId: req.params.id
            });
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔄 تغییر نقش کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * تغییر نقش کاربر
     * @route PATCH /api/v1/users/:id/role
     * @access Private (Admin)
     */
    async changeUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role, reason } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const validRoles = ['admin', 'manager', 'user', 'guest'];
            if (!validRoles.includes(role.toLowerCase())) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('نقش معتبر نیست')
                );
            }

            // جلوگیری از تغییر نقش خودش
            if (parseInt(id) === req.user?.id) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('نمی‌توانید نقش خود را تغییر دهید')
                );
            }

            const oldRole = user.role;

            await User.update(id, {
                role: role.toLowerCase(),
                role_changed_at: new Date(),
                role_changed_by: req.user?.id,
                role_change_reason: reason || null,
                updated_at: new Date()
            });

            // لاگ تغییر نقش
            logger.security('ROLE_CHANGE', {
                userId: id,
                oldRole,
                newRole: role,
                changedBy: req.user?.id,
                reason
            });

            logger.info(`User role changed: ID=${id}, ${oldRole} -> ${role}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse('نقش کاربر تغییر کرد', {
                    id: parseInt(id),
                    oldRole,
                    newRole: role.toLowerCase()
                })
            );
        } catch (error) {
            logger.errorWithStack('Change User Role Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔐 ریست رمز عبور
    // ═══════════════════════════════════════════════════════════════════
    /**
     * ریست رمز عبور کاربر توسط ادمین
     * @route POST /api/v1/users/:id/reset-password
     * @access Private (Admin)
     */
    async resetUserPassword(req, res) {
        try {
            const { id } = req.params;
            const {
                newPassword,
                forceChange = false,
                sendNotification = true,
                notifyVia = 'email' // email, sms, both
            } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // اعتبارسنجی رمز عبور جدید
            if (!newPassword || newPassword.length < 8) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
                );
            }

            // بررسی قدرت رمز عبور
            const passwordStrength = this.checkPasswordStrength(newPassword);
            if (passwordStrength.score < 3) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('رمز عبور جدید ضعیف است', {
                        strength: passwordStrength
                    })
                );
            }

            // بررسی تکراری نبودن رمز عبور
            const isSame = await bcrypt.compare(newPassword, user.password);
            if (isSame) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('رمز عبور جدید نمی‌تواند مشابه رمز عبور قبلی باشد')
                );
            }

            // هش کردن رمز عبور جدید
            const hashedPassword = await bcrypt.hash(newPassword, config.SECURITY.BCRYPT.SALT_ROUNDS);

            // تولید رمز عبور موقت
            const tempPassword = crypto.randomBytes(8).toString('hex');

            await User.update(id, {
                password: hashedPassword,
                temp_password: await bcrypt.hash(tempPassword, 10),
                force_password_change: forceChange ? 1 : 0,
                last_password_change: new Date(),
                password_changed_by: req.user?.id,
                password_history: JSON.stringify([
                    ...(user.password_history ? JSON.parse(user.password_history) : []),
                    {
                        changedAt: new Date(),
                        changedBy: req.user?.id
                    }
                ].slice(-5)), // نگه‌داشتن ۵ تغییر آخر
                updated_at: new Date()
            });

            // ارسال اعلان
            if (sendNotification) {
                try {
                    if (notifyVia === 'email' || notifyVia === 'both') {
                        await emailService.sendPasswordResetNotification({
                            to: user.email,
                            username: user.username,
                            changedBy: req.user?.username,
                            forceChange
                        });
                    }
                    if ((notifyVia === 'sms' || notifyVia === 'both') && user.phone) {
                        await smsService.sendPasswordResetSMS({
                            phone: user.phone,
                            username: user.username
                        });
                    }
                } catch (notifyError) {
                    logger.warn('Failed to send password reset notification', {
                        userId: id,
                        error: notifyError.message
                    });
                }
            }

            // لاگ امنیتی
            logger.security('PASSWORD_RESET_BY_ADMIN', {
                userId: id,
                adminId: req.user?.id,
                forceChange
            });

            logger.info(`User password reset: ID=${id}`, {
                adminId: req.user?.id,
                forceChange
            });

            return res.status(status.OK).json(
                successResponse('رمز عبور کاربر ریست شد', {
                    id: parseInt(id),
                    forcePasswordChange: forceChange
                })
            );
        } catch (error) {
            logger.errorWithStack('Reset User Password Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🗑️ حذف کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * حذف کاربر (نرم یا سخت)
     * @route DELETE /api/v1/users/:id
     * @access Private (Admin)
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const { hardDelete = false, reason, deleteRelatedData = false } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // جلوگیری از حذف خودش
            if (parseInt(id) === req.user?.id) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(messages.CANNOT_DELETE_SELF)
                );
            }

            // جلوگیری از حذف ادمین اصلی
            if (user.role === 'admin') {
                const [adminCount] = await User.db.query(
                    'SELECT COUNT(*) as count FROM users WHERE role = ?',
                    ['admin']
                );
                if (adminCount[0].count <= 1) {
                    return res.status(status.BAD_REQUEST).json(
                        errorResponse('نمی‌توانید آخرین ادمین را حذف کنید')
                    );
                }
            }

            if (hardDelete === 'true') {
                // حذف دائمی
                if (deleteRelatedData === 'true') {
                    // حذف داده‌های مرتبط
                    await this.deleteUserRelatedData(id);
                }
                await User.delete(id);

                logger.security('USER_PERMANENTLY_DELETED', {
                    userId: id,
                    deletedBy: req.user?.id,
                    reason
                });

                logger.info(`User permanently deleted: ID=${id}`, {
                    adminId: req.user?.id,
                    reason
                });
            } else {
                // حذف نرم
                await User.update(id, {
                    is_active: 0,
                    is_deleted: 1,
                    deleted_at: new Date(),
                    deleted_by: req.user?.id,
                    deletion_reason: reason,
                    updated_at: new Date()
                });

                // غیرفعال کردن جلسات
                await this.invalidateUserSessions(id);

                logger.security('USER_SOFT_DELETED', {
                    userId: id,
                    deletedBy: req.user?.id,
                    reason
                });

                logger.info(`User soft deleted: ID=${id}`, {
                    adminId: req.user?.id,
                    reason
                });
            }

            // پاک کردن کش
            await cache.del(`${this.cachePrefix}${id}*`);

            return res.status(status.OK).json(
                successResponse(messages.USER_DELETED, {
                    id: parseInt(id),
                    type: hardDelete === 'true' ? 'permanent' : 'soft'
                })
            );
        } catch (error) {
            logger.errorWithStack('Delete User Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔄 تغییر وضعیت کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * تغییر وضعیت فعال/غیرفعال کاربر
     * @route PATCH /api/v1/users/:id/status
     * @access Private (Admin)
     */
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { reason, notify = true } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // جلوگیری از تغییر وضعیت خودش
            if (parseInt(id) === req.user?.id) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('نمی‌توانید وضعیت خود را تغییر دهید')
                );
            }

            const newStatus = !user.is_active;

            await User.update(id, {
                is_active: newStatus ? 1 : 0,
                status_changed_at: new Date(),
                status_changed_by: req.user?.id,
                status_change_reason: reason,
                updated_at: new Date()
            });

            // ارسال اعلان
            if (notify) {
                try {
                    await emailService.sendStatusChangeNotification({
                        to: user.email,
                        username: user.username,
                        newStatus: newStatus ? 'فعال' : 'غیرفعال',
                        reason,
                        changedBy: req.user?.username
                    });
                } catch (e) {
                    logger.warn('Failed to send status change notification');
                }
            }

            // لاگ امنیتی
            logger.security('USER_STATUS_CHANGED', {
                userId: id,
                oldStatus: user.is_active,
                newStatus,
                changedBy: req.user?.id,
                reason
            });

            logger.info(`User status toggled: ID=${id}, new status: ${newStatus}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse(messages.USER_STATUS_TOGGLED, {
                    is_active: newStatus,
                    reason: reason || null
                })
            );
        } catch (error) {
            logger.errorWithStack('Toggle User Status Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🚫 تعلیق کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * تعلیق کاربر
     * @route POST /api/v1/users/:id/suspend
     * @access Private (Admin)
     */
    async suspendUser(req, res) {
        try {
            const { id } = req.params;
            const { reason, duration, notify = true } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (user.is_suspended) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('کاربر قبلاً تعلیق شده است')
                );
            }

            // جلوگیری از تعلیق خودش
            if (parseInt(id) === req.user?.id) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('نمی‌توانید خود را تعلیق کنید')
                );
            }

            let suspensionData = {
                is_suspended: 1,
                suspension_reason: reason,
                suspended_at: new Date(),
                suspended_by: req.user?.id,
                updated_at: new Date()
            };

            // مدت زمان تعلیق
            if (duration) {
                const unsuspendDate = new Date();
                unsuspendDate.setDate(unsuspendDate.getDate() + parseInt(duration));
                suspensionData.unsuspend_at = unsuspendDate;
            }

            await User.update(id, suspensionData);

            // غیرفعال کردن جلسات فعال
            await this.invalidateUserSessions(id);

            // ارسال اعلان
            if (notify) {
                try {
                    await emailService.sendSuspensionNotification({
                        to: user.email,
                        username: user.username,
                        reason,
                        duration,
                        unsuspendAt: suspensionData.unsuspend_at
                    });
                } catch (e) {
                    logger.warn('Failed to send suspension notification');
                }
            }

            logger.security('USER_SUSPENDED', {
                userId: id,
                reason,
                duration,
                suspendedBy: req.user?.id
            });

            logger.info(`User suspended: ID=${id}, reason: ${reason}, duration: ${duration}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse('کاربر تعلیق شد', {
                    id: parseInt(id),
                    reason,
                    duration: duration || 'نامحدود',
                    unsuspendAt: suspensionData.unsuspend_at
                })
            );
        } catch (error) {
            logger.errorWithStack('Suspend User Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ✅ رفع تعلیق کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * رفع تعلیق کاربر
     * @route POST /api/v1/users/:id/unsuspend
     * @access Private (Admin)
     */
    async unsuspendUser(req, res) {
        try {
            const { id } = req.params;
            const { notify = true } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (!user.is_suspended) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('کاربر تعلیق نشده است')
                );
            }

            await User.update(id, {
                is_suspended: 0,
                suspension_reason: null,
                suspended_at: null,
                suspended_by: null,
                unsuspend_at: null,
                unsuspended_at: new Date(),
                unsuspended_by: req.user?.id,
                updated_at: new Date()
            });

            // ارسال اعلان
            if (notify) {
                try {
                    await emailService.sendUnsuspensionNotification({
                        to: user.email,
                        username: user.username,
                        unsuspendedBy: req.user?.username
                    });
                } catch (e) {
                    logger.warn('Failed to send unsuspension notification');
                }
            }

            logger.security('USER_UNSUSPENDED', {
                userId: id,
                unsuspendedBy: req.user?.id
            });

            logger.info(`User unsuspended: ID=${id}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse('تعلیق کاربر رفع شد', {
                    id: parseInt(id)
                })
            );
        } catch (error) {
            logger.errorWithStack('Unsuspend User Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📤 خروجی گرفتن از کاربران
    // ═══════════════════════════════════════════════════════════════════
    /**
     * خروجی گرفتن از کاربران
     * @route GET /api/v1/users/export
     * @access Private (Admin)
     */
    async exportUsers(req, res) {
        try {
            const {
                format = 'json',
                role,
                status: userStatus,
                fields = 'basic',
                includeInactive = false
            } = req.query;

            let query = 'SELECT * FROM users WHERE 1=1';
            const params = [];

            // ═══════════════════════════════════════════════════════════════════
            if (role) {
                query += ' AND role = ?';
                params.push(role.toLowerCase());
            }

            if (!includeInactive) {
                query += ' AND is_active = 1';
            }

            if (userStatus === 'active') {
                query += ' AND is_active = 1 AND is_suspended = 0';
            } else if (userStatus === 'inactive') {
                query += ' AND is_active = 0';
            } else if (userStatus === 'suspended') {
                query += ' AND is_suspended = 1';
            }

            query += ' ORDER BY created_at DESC';

            const [users] = await User.db.query(query, params);

            // فیلتر فیلدها و حذف حساس‌ها
            const sanitizedUsers = users.map(user => this.sanitizeUserForExport(user, fields));

            logger.info(`Users exported: ${sanitizedUsers.length} records, format: ${format}`, {
                adminId: req.user?.id,
                format
            });

            // خروجی بر اساس فرمت
            if (format === 'csv') {
                return this.exportToCSV(res, sanitizedUsers);
            } else if (format === 'excel') {
                return this.exportToExcel(res, sanitizedUsers);
            } else {
                return res.status(status.OK).json(
                    successResponse('کاربران خروجی گرفته شدند', {
                        count: sanitizedUsers.length,
                        data: sanitizedUsers,
                        exportedAt: new Date().toISOString()
                    })
                );
            }
        } catch (error) {
            logger.errorWithStack('Export Users Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📦 عملیات Bulk
    // ═══════════════════════════════════════════════════════════════════
    /**
     * عملیات دسته‌ای روی چند کاربر
     * @route POST /api/v1/users/bulk
     * @access Private (Admin)
     */
    async bulkAction(req, res) {
        try {
            const { userIds, action, data, reason } = req.body;

            // اعتبارسنجی اولیه
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('لیست کاربران الزامی است')
                );
            }

            if (userIds.length > 100) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('حداکثر ۱۰۰ کاربر را می‌توانید انتخاب کنید')
                );
            }

            const validActions = ['delete', 'activate', 'deactivate', 'suspend', 'unsuspend', 'export', 'changeRole', 'sendEmail'];
            if (!validActions.includes(action)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('عملیات معتبر نیست')
                );
            }

            const result = {
                success: 0,
                failed: 0,
                errors: [],
                total: userIds.length
            };

            // اجرای عملیات
            switch (action) {
                case 'delete':
                    await this.bulkDelete(userIds, result, req.user?.id);
                    break;
                case 'activate':
                    await this.bulkUpdate(userIds, { is_active: 1 }, result);
                    break;
                case 'deactivate':
                    await this.bulkUpdate(userIds, { is_active: 0 }, result);
                    break;
                case 'suspend':
                    await this.bulkSuspend(userIds, data, result, req.user?.id);
                    break;
                case 'unsuspend':
                    await this.bulkUpdate(userIds, { is_suspended: 0 }, result);
                    break;
                case 'changeRole':
                    if (!data?.role) {
                        return res.status(status.BAD_REQUEST).json(
                            errorResponse('نقش الزامی است')
                        );
                    }
                    await this.bulkUpdate(userIds, { role: data.role }, result);
                    break;
                case 'export':
                    const [users] = await User.db.query(
                        `SELECT * FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
                        userIds
                    );
                    result.data = users;
                    result.success = users.length;
                    break;
                case 'sendEmail':
                    if (!data?.subject || !data?.message) {
                        return res.status(status.BAD_REQUEST).json(
                            errorResponse('موضوع و متن ایمیل الزامی است')
                        );
                    }
                    await this.bulkSendEmail(userIds, data, result);
                    break;
            }

            logger.info(`Bulk action completed: ${action}`, {
                adminId: req.user?.id,
                success: result.success,
                failed: result.failed
            });

            return res.status(status.OK).json(
                successResponse('عملیات انجام شد', result)
            );
        } catch (error) {
            logger.errorWithStack('Bulk Action Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📜 تاریخچه فعالیت کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * دریافت تاریخچه فعالیت کاربر
     * @route GET /api/v1/users/:id/activity
     * @access Private (Admin)
     */
    async getUserActivity(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20, type, startDate, endDate } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const offset = (page - 1) * limit;

            let query = `
                SELECT id, user_id, action, description, ip_address, user_agent, metadata, created_at
                FROM user_activities
                WHERE user_id = ?
            `;
            const params = [id];

            // فیلتر نوع فعالیت
            if (type) {
                query += ' AND action = ?';
                params.push(type);
            }

            // فیلتر تاریخ
            if (startDate) {
                query += ' AND created_at >= ?';
                params.push(new Date(startDate));
            }
            if (endDate) {
                query += ' AND created_at <= ?';
                params.push(new Date(endDate));
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [activities] = await User.db.query(query, params);

            const [countResult] = await User.db.query(
                'SELECT COUNT(*) as total FROM user_activities WHERE user_id = ?',
                [id]
            );

            logger.info(`User activity fetched: userId=${id}, count=${activities.length}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                paginatedResponse('فعالیت‌های کاربر', activities, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get User Activity Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🔐 تایید ایمیل کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * تایید ایمیل کاربر توسط ادمین
     * @route POST /api/v1/users/:id/verify-email
     * @access Private (Admin)
     */
    async verifyEmail(req, res) {
        try {
            const { id } = req.params;
            const { sendNotification = true } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (user.is_verified) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('ایمیل قبلاً تایید شده است')
                );
            }

            await User.update(id, {
                is_verified: 1,
                email_verified_at: new Date(),
                email_verified_by: req.user?.id,
                updated_at: new Date()
            });

            // ارسال اعلان
            if (sendNotification) {
                try {
                    await emailService.sendEmailVerifiedNotification({
                        to: user.email,
                        username: user.username
                    });
                } catch (e) {
                    logger.warn('Failed to send email verification notification');
                }
            }

            logger.security('EMAIL_VERIFIED_BY_ADMIN', {
                userId: id,
                verifiedBy: req.user?.id
            });

            logger.info(`User email verified: ID=${id}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse('ایمیل کاربر تایید شد', {
                    id: parseInt(id)
                })
            );
        } catch (error) {
            logger.errorWithStack('Verify Email Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📱 تایید شماره موبایل کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * تایید شماره موبایل کاربر توسط ادمین
     * @route POST /api/v1/users/:id/verify-phone
     * @access Private (Admin)
     */
    async verifyPhone(req, res) {
        try {
            const { id } = req.params;
            const { sendNotification = true } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (!user.phone) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('کاربر شماره موبایل ثبت نکرده است')
                );
            }

            if (user.phone_verified_at) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('شماره موبایل قبلاً تایید شده است')
                );
            }

            await User.update(id, {
                phone_verified_at: new Date(),
                phone_verified_by: req.user?.id,
                updated_at: new Date()
            });

            // ارسال اعلان
            if (sendNotification && user.phone) {
                try {
                    await smsService.sendPhoneVerifiedSMS({
                        phone: user.phone,
                        username: user.username
                    });
                } catch (e) {
                    logger.warn('Failed to send phone verification SMS');
                }
            }

            logger.security('PHONE_VERIFIED_BY_ADMIN', {
                userId: id,
                verifiedBy: req.user?.id
            });

            logger.info(`User phone verified: ID=${id}`, {
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse('شماره موبایل کاربر تایید شد', {
                    id: parseInt(id)
                })
            );
        } catch (error) {
            logger.errorWithStack('Verify Phone Error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📊 آمار تفصیلی کاربر
    // ═══════════════════════════════════════════════════════════════════
    /**
     * دریافت آمار تفصیلی یک کاربر
     */
    async getUserDetailedStats(userId) {
        const stats = {};

        // تعداد ورود
        const [loginCount] = await User.db.query(
            'SELECT COUNT(*) as count FROM user_logins WHERE user_id = ?',
            [userId]
        );
        stats.loginCount = loginCount[0].count;

        // آخرین ورود
        const [lastLogin] = await User.db.query(
            'SELECT created_at FROM user_logins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        stats.lastLogin = lastLogin[0]?.created_at;

        // تعداد سفارشات
        const [orderCount] = await User.db.query(
            'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
            [userId]
        );
        stats.orderCount = orderCount[0].count;

        // تعداد فایل‌های آپلود شده
        const [uploadCount] = await User.db.query(
            'SELECT COUNT(*) as count FROM uploads WHERE user_id = ?',
            [userId]
        );
        stats.uploadCount = uploadCount[0].count;

        // تعداد کامنت‌ها
        const [commentCount] = await User.db.query(
            'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
            [userId]
        );
        stats.commentCount = commentCount[0].count;

        return stats;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎯 متدهای کمکی
    // ═══════════════════════════════════════════════════════════════════
    /**
     * ساخت کوئری کاربران
     */
    buildUserQuery({ role, isActive, isVerified, userStatus, search, startDate, endDate, sortField, order, limit, offset }) {
        let query = `
            SELECT id, username, email, first_name, last_name, phone, role, avatar, is_active, is_verified, is_suspended, last_login, created_at, updated_at
            FROM users
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const params = [];
        const countParams = [];

        // فیلترها
        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            params.push(role.toLowerCase());
            countParams.push(role.toLowerCase());
        }

        if (isActive !== undefined) {
            query += ' AND is_active = ?';
            countQuery += ' AND is_active = ?';
            params.push(isActive === 'true' ? 1 : 0);
            countParams.push(isActive === 'true' ? 1 : 0);
        }

        if (isVerified !== undefined) {
            query += ' AND is_verified = ?';
            countQuery += ' AND is_verified = ?';
            params.push(isVerified === 'true' ? 1 : 0);
            countParams.push(isVerified === 'true' ? 1 : 0);
        }

        if (userStatus) {
            if (userStatus === 'suspended') {
                query += ' AND is_suspended = 1';
                countQuery += ' AND is_suspended = 1';
            } else if (userStatus === 'active') {
                query += ' AND is_active = 1 AND is_suspended = 0';
                countQuery += ' AND is_active = 1 AND is_suspended = 0';
            } else if (userStatus === 'inactive') {
                query += ' AND is_active = 0';
                countQuery += ' AND is_active = 0';
            }
        }

        // جستجو
        if (search && search.trim()) {
            const searchPattern = `%${search.trim()}%`;
            query += ' AND (username LIKE ? OR email LIKE ? OR phone LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
            countQuery += ' AND (username LIKE ? OR email LIKE ? OR phone LIKE ?)';
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
            countParams.push(searchPattern, searchPattern, searchPattern);
        }

        // فیلتر تاریخ
        if (startDate) {
            query += ' AND created_at >= ?';
            countQuery += ' AND created_at >= ?';
            params.push(new Date(startDate));
            countParams.push(new Date(startDate));
        }
        if (endDate) {
            query += ' AND created_at <= ?';
            countQuery += ' AND created_at <= ?';
            params.push(new Date(endDate));
            countParams.push(new Date(endDate));
        }

        // مرتب‌سازی و paginate
        query += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return { query, params, countQuery, countParams };
    }

    /**
     * فیلتر فیلدهای خروجی
     */
    filterUserFields(users, level) {
        const fieldsMap = {
            basic: ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'avatar', 'is_active', 'is_verified', 'created_at'],
            extended: ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'avatar', 'cover', 'bio', 'is_active', 'is_verified', 'last_login', 'created_at', 'updated_at'],
            full: ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'avatar', 'cover', 'bio', 'role', 'is_active', 'is_verified', 'is_suspended', 'last_login', 'login_count', 'created_at', 'updated_at', 'email_verified_at', 'phone_verified_at']
        };

        const fields = fieldsMap[level] || fieldsMap.basic;
        return users.map(user => {
            const filtered = {};
            fields.forEach(field => {
                if (user[field] !== undefined) {
                    filtered[field] = user[field];
                }
            });
            return filtered;
        });
    }

    /**
     * ساخت داده‌های کاربر بر اساس level
     */
    buildUserData(user, level) {
        const data = {
            basic: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                is_active: user.is_active,
                is_verified: user.is_verified,
                created_at: user.created_at
            },
            extended: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                avatar: user.avatar,
                cover: user.cover,
                bio: user.bio,
                role: user.role,
                is_active: user.is_active,
                is_verified: user.is_verified,
                last_login: user.last_login,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            full: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                avatar: user.avatar,
                cover: user.cover,
                bio: user.bio,
                role: user.role,
                is_active: user.is_active,
                is_verified: user.is_verified,
                is_suspended: user.is_suspended,
                suspension_reason: user.suspension_reason,
                last_login: user.last_login,
                login_count: user.login_count,
                created_at: user.created_at,
                updated_at: user.updated_at,
                email_verified_at: user.email_verified_at,
                phone_verified_at: user.phone_verified_at,
                two_factor_enabled: user.two_factor_enabled,
                last_password_change: user.last_password_change
            }
        };

        return data[level] || data.basic;
    }

    /**
     * ساخت داده‌های آپدیت
     */
    buildUpdateData(data) {
        const updateData = {};
        const fieldMap = {
            first_name: 'first_name',
            last_name: 'last_name',
            phone: 'phone',
            role: 'role',
            is_active: 'is_active',
            is_verified: 'is_verified',
            bio: 'bio',
            avatar: 'avatar',
            cover: 'cover'
        };

        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (data[key] !== undefined) {
                if (key === 'role') {
                    updateData[dbField] = data[key].toLowerCase();
                } else if (key === 'is_active' || key === 'is_verified') {
                    updateData[dbField] = data[key] ? 1 : 0;
                } else {
                    updateData[dbField] = data[key];
                }
            }
        }

        if (data.settings) {
            updateData.settings = JSON.stringify(data.settings);
        }
        if (data.meta) {
            updateData.meta = JSON.stringify(data.meta);
        }

        return updateData;
    }

    /**
     * بررسی قدرت رمز عبور
     */
    checkPasswordStrength(password) {
        let score = 0;
        const feedback = [];

        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        // بررسی الگوهای رایج
        const commonPatterns = ['123456', 'password', 'qwerty', 'admin', 'letmein'];
        if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
            score = Math.max(0, score - 2);
            feedback.push('از الگوهای رایج استفاده نکنید');
        }

        return { score, feedback };
    }

    /**
     * پیشنهاد برای رمز عبور بهتر
     */
    getPasswordSuggestions(password) {
        const suggestions = [];
        if (password.length < 12) suggestions.push('حداقل ۱۲ کاراکتر');
        if (!/[a-z]/.test(password)) suggestions.push('حروف کوچک');
        if (!/[A-Z]/.test(password)) suggestions.push('حروف بزرگ');
        if (!/[0-9]/.test(password)) suggestions.push('عدد');
        if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('کاراکتر خاص');
        return suggestions;
    }

    /**
     * محاسبه فیلتر تاریخ
     */
    getDateFilter(period) {
        const now = new Date();
        const filters = {
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
            '1y': 365 * 24 * 60 * 60 * 1000
        };
        return new Date(now - (filters[period] || filters['30d']));
    }

    /**
     * دریافت ثبت‌نام‌های روزانه
     */
    async getDailyRegistrations(period) {
        const dateFilter = this.getDateFilter(period);
        return User.db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [dateFilter]);
    }

    /**
     * دریافت فعالیت‌های اخیر کاربر
     */
    async getUserRecentActivity(userId, limit = 10) {
        const [activities] = await User.db.query(`
            SELECT action, description, ip_address, created_at
            FROM user_activities
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `, [userId, limit]);
        return activities;
    }

    /**
     * دریافت جلسات فعال کاربر
     */
    async getUserActiveSessions(userId) {
        const [sessions] = await User.db.query(`
            SELECT id, device, ip_address, created_at, expires_at
            FROM user_sessions
            WHERE user_id = ? AND expires_at > NOW()
            ORDER BY created_at DESC
        `, [userId]);
        return sessions;
    }

    /**
     * دریافت دستگاه‌های کاربر
     */
    async getUserDevices(userId) {
        const [devices] = await User.db.query(`
            SELECT device_type, browser, os, COUNT(*) as count, MAX(created_at) as last_used
            FROM user_logins
            WHERE user_id = ?
            GROUP BY device_type, browser, os
        `, [userId]);
        return devices;
    }

    /**
     * دریافت مجوزهای کاربر
     */
    async getUserPermissions(userId) {
        const [permissions] = await User.db.query(`
            SELECT p.name, p.description, up.granted_at, up.expires_at
            FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = ? AND (up.expires_at IS NULL OR up.expires_at > NOW())
        `, [userId]);
        return permissions;
    }

    /**
     * حذف داده‌های مرتبط کاربر
     */
    async deleteUserRelatedData(userId) {
        await Promise.all([
            User.db.query('DELETE FROM user_sessions WHERE user_id = ?', [userId]),
            User.db.query('DELETE FROM user_activities WHERE user_id = ?', [userId]),
            User.db.query('DELETE FROM user_logins WHERE user_id = ?', [userId]),
            User.db.query('DELETE FROM password_resets WHERE user_id = ?', [userId]),
            User.db.query('DELETE FROM email_verifications WHERE user_id = ?', [userId])
        ]);
    }

    /**
     * غیرفعال کردن جلسات کاربر
     */
    async invalidateUserSessions(userId) {
        await User.db.query(`
            UPDATE user_sessions
            SET expires_at = NOW()
            WHERE user_id = ? AND expires_at > NOW()
        `, [userId]);
    }

    /**
     * حذف کاربران (Bulk)
     */
    async bulkDelete(userIds, result, adminId) {
        for (const userId of userIds) {
            try {
                await User.update(userId, {
                    is_active: 0,
                    deleted_at: new Date(),
                    deleted_by: adminId
                });
                result.success++;
            } catch (e) {
                result.failed++;
                result.errors.push({ id: userId, error: e.message });
            }
        }
    }

    /**
     * آپدیت کاربران (Bulk)
     */
    async bulkUpdate(userIds, data, result) {
        for (const userId of userIds) {
            try {
                await User.update(userId, {
                    ...data,
                    updated_at: new Date()
                });
                result.success++;
            } catch (e) {
                result.failed++;
                result.errors.push({ id: userId, error: e.message });
            }
        }
    }

    /**
     * تعلیق کاربران (Bulk)
     */
    async bulkSuspend(userIds, data, result, adminId) {
        for (const userId of userIds) {
            try {
                await User.update(userId, {
                    is_suspended: 1,
                    suspension_reason: data?.reason,
                    suspended_at: new Date(),
                    suspended_by: adminId,
                    updated_at: new Date()
                });
                result.success++;
            } catch (e) {
                result.failed++;
                result.errors.push({ id: userId, error: e.message });
            }
        }
    }

    /**
     * ارسال ایمیل دسته‌ای
     */
    async bulkSendEmail(userIds, data, result) {
        const [users] = await User.db.query(
            `SELECT email, username FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
            userIds
        );

        for (const user of users) {
            try {
                await emailService.send({
                    to: user.email,
                    subject: data.subject,
                    body: data.message
                });
                result.success++;
            } catch (e) {
                result.failed++;
                result.errors.push({ email: user.email, error: e.message });
            }
        }
    }

    /**
     * خروجی به CSV
     */
    exportToCSV(res, users) {
        if (users.length === 0) {
            return res.status(status.OK).send('No data');
        }

        const headers = Object.keys(users[0]);
        const csvHeader = headers.join(',');
        const csvData = users.map(user =>
            headers.map(header => {
                const value = user[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
        return res.send(csvHeader + '\n' + csvData);
    }

    /**
     * خروجی به Excel
     */
    exportToExcel(res, users) {
        // در صورت نیاز از xlsx استفاده کنید
        // const XLSX = require('xlsx');
        // const worksheet = XLSX.utils.json_to_sheet(users);
        // const workbook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        // const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // فعلاً JSON برمی‌گردانیم
        return res.status(status.OK).json(
            successResponse('کاربران خروجی گرفته شدند', {
                count: users.length,
                data: users,
                format: 'excel',
                exportedAt: new Date().toISOString()
            })
        );
    }

    /**
     * آماده‌سازی کاربر برای خروجی
     */
    sanitizeUserForExport(user, fields) {
        const sensitiveFields = ['password', 'temp_password', 'verification_token', 'reset_token'];
        const exportFields = fields === 'full'
            ? Object.keys(user).filter(k => !sensitiveFields.includes(k))
            : ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_active', 'is_verified', 'created_at', 'last_login'];

        const sanitized = {};
        exportFields.forEach(field => {
            if (user[field] !== undefined) {
                sanitized[field] = user[field];
            }
        });
        return sanitized;
    }

    // ==================== NEW FEATURE 1: ADVANCED RBAC 2.0 ====================

    /**
     * Get role hierarchy
     * @param {string} role - User role
     * @returns {Array} Array of subordinate roles
     */
    async getRoleHierarchy(role) {
        try {
            return this.roleHierarchy[role] || [];
        } catch (error) {
            logger.error('Get role hierarchy error', error);
            return [];
        }
    }

    /**
     * Check if user can manage target role
     * @param {string} userRole - Current user role
     * @param {string} targetRole - Target user role
     * @returns {boolean} True if user can manage target
     */
    async canManageRole(userRole, targetRole) {
        try {
            if (userRole === 'super_admin') return true;
            const subordinateRoles = this.roleHierarchy[userRole] || [];
            return subordinateRoles.includes(targetRole);
        } catch (error) {
            logger.error('Check role management permission error', error);
            return false;
        }
    }

    /**
     * Get field permissions for role
     * @param {string} role - User role
     * @returns {Object} Field permissions
     */
    async getFieldPermissions(role) {
        try {
            return this.fieldPermissions[role] || { hidden: [], readOnly: [] };
        } catch (error) {
            logger.error('Get field permissions error', error);
            return { hidden: [], readOnly: [] };
        }
    }

    /**
     * Apply field permissions to user data
     * @param {Object} userData - User data
     * @param {string} viewerRole - Role of viewer
     * @returns {Object} Filtered user data
     */
    async applyFieldPermissions(userData, viewerRole) {
        try {
            const permissions = await this.getFieldPermissions(viewerRole);
            const result = { ...userData };

            // Remove hidden fields
            permissions.hidden.forEach(field => {
                if (result[field] !== undefined) {
                    delete result[field];
                }
            });

            // Mark read-only fields
            permissions.readOnly.forEach(field => {
                if (result[field] !== undefined) {
                    result[`${field}_readonly`] = true;
                }
            });

            return result;
        } catch (error) {
            logger.error('Apply field permissions error', error);
            return userData;
        }
    }

    /**
     * Create role change audit trail
     * @param {number} userId - Target user ID
     * @param {string} oldRole - Old role
     * @param {string} newRole - New role
     * @param {number} changedBy - Admin ID who changed
     * @param {string} reason - Change reason
     * @returns {Promise<boolean>} Success status
     */
    async createRoleChangeAudit(userId, oldRole, newRole, changedBy, reason) {
        try {
            await User.db.query(`
                INSERT INTO role_change_audit (
                    user_id, old_role, new_role, changed_by, reason, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, oldRole, newRole, changedBy, reason, new Date()]);

            // Create approval workflow if needed
            if (['admin', 'super_admin'].includes(newRole)) {
                await this.createRoleApprovalRequest(userId, oldRole, newRole, changedBy);
            }

            logger.info('Role change audit created', { userId, oldRole, newRole, changedBy });
            return true;
        } catch (error) {
            logger.error('Create role change audit error', error);
            return false;
        }
    }

    /**
     * Create role approval request
     * @param {number} userId - Target user ID
     * @param {string} oldRole - Old role
     * @param {string} newRole - New role
     * @param {number} requesterId - Requester ID
     * @returns {Promise<boolean>} Success status
     */
    async createRoleApprovalRequest(userId, oldRole, newRole, requesterId) {
        try {
            // Get super admins for approval
            const [superAdmins] = await User.db.query(`
                SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1
            `);

            if (superAdmins.length === 0) {
                logger.warn('No super admins found for approval');
                return false;
            }

            const approvalId = crypto.randomBytes(16).toString('hex');

            await User.db.query(`
                INSERT INTO role_approval_requests (
                    approval_id, user_id, old_role, new_role, requester_id,
                    status, created_at, expires_at
                ) VALUES (?, ?, ?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
            `, [approvalId, userId, oldRole, newRole, requesterId, new Date()]);

            // Notify super admins
            await this.notifyRoleApproval(superAdmins, userId, newRole, approvalId);

            logger.info('Role approval request created', { userId, newRole, approvalId });
            return true;
        } catch (error) {
            logger.error('Create role approval request error', error);
            return false;
        }
    }

    /**
     * Notify super admins about role approval request
     * @param {Array} superAdmins - Super admin users
     * @param {number} userId - Target user ID
     * @param {string} newRole - New role
     * @param {string} approvalId - Approval request ID
     */
    async notifyRoleApproval(superAdmins, userId, newRole, approvalId) {
        try {
            const [user] = await User.db.query('SELECT username, email FROM users WHERE id = ?', [userId]);
            if (!user[0]) return;

            const notifications = superAdmins.map(admin => ({
                user_id: admin.id,
                type: 'role_approval',
                title: 'Role Change Approval Required',
                message: `User ${user[0].username} (ID: ${userId}) is requesting role change to ${newRole}`,
                data: JSON.stringify({ userId, newRole, approvalId }),
                priority: 'high',
                created_at: new Date()
            }));

            if (notifications.length > 0) {
                await User.db.query(`
                    INSERT INTO notifications (user_id, type, title, message, data, priority, created_at)
                    VALUES ${notifications.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',')}
                `, notifications.flatMap(n => [n.user_id, n.type, n.title, n.message, n.data, n.priority, n.created_at]));
            }
        } catch (error) {
            logger.error('Notify role approval error', error);
        }
    }

    /**
     * Process role approval request
     * @route POST /api/v1/users/role-approval/:approvalId
     * @access Private (Super Admin)
     */
    async processRoleApproval(req, res) {
        try {
            const { approvalId } = req.params;
            const { action, reason } = req.body; // action: 'approve' or 'reject'

            if (!['approve', 'reject'].includes(action)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Invalid action')
                );
            }

            // Get approval request
            const [requests] = await User.db.query(`
                SELECT * FROM role_approval_requests 
                WHERE approval_id = ? AND status = 'pending'
            `, [approvalId]);

            if (requests.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Approval request not found or already processed')
                );
            }

            const request = requests[0];

            if (action === 'approve') {
                // Update user role
                await User.update(request.user_id, {
                    role: request.new_role,
                    role_changed_at: new Date(),
                    role_changed_by: req.user.id,
                    role_change_reason: reason || 'Approved by super admin'
                });

                // Update request status
                await User.db.query(`
                    UPDATE role_approval_requests 
                    SET status = 'approved', approved_by = ?, approved_at = ?, rejection_reason = ?
                    WHERE approval_id = ?
                `, [req.user.id, new Date(), reason, approvalId]);

                // Notify requester
                await this.createNotification(request.requester_id, {
                    type: 'role_approval',
                    title: 'Role Change Approved',
                    message: `Role change for user ${request.user_id} to ${request.new_role} has been approved`,
                    priority: 'medium'
                });

                logger.security('ROLE_APPROVAL_APPROVED', {
                    approvalId,
                    userId: request.user_id,
                    approvedBy: req.user.id
                });
            } else {
                // Update request status as rejected
                await User.db.query(`
                    UPDATE role_approval_requests 
                    SET status = 'rejected', rejected_by = ?, rejected_at = ?, rejection_reason = ?
                    WHERE approval_id = ?
                `, [req.user.id, new Date(), reason, approvalId]);

                // Notify requester
                await this.createNotification(request.requester_id, {
                    type: 'role_approval',
                    title: 'Role Change Rejected',
                    message: `Role change for user ${request.user_id} to ${request.new_role} has been rejected`,
                    data: JSON.stringify({ reason }),
                    priority: 'medium'
                });

                logger.security('ROLE_APPROVAL_REJECTED', {
                    approvalId,
                    userId: request.user_id,
                    rejectedBy: req.user.id,
                    reason
                });
            }

            return res.status(status.OK).json(
                successResponse(`Role change ${action}d successfully`)
            );
        } catch (error) {
            logger.errorWithStack('Process role approval error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get role change audit history
     * @route GET /api/v1/users/:id/role-history
     * @access Private (Admin)
     */
    async getRoleChangeHistory(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const offset = (page - 1) * limit;

            const [history] = await User.db.query(`
                SELECT rca.*, u1.username as changed_by_username, u2.username as approved_by_username
                FROM role_change_audit rca
                LEFT JOIN users u1 ON rca.changed_by = u1.id
                LEFT JOIN users u2 ON rca.approved_by = u2.id
                WHERE rca.user_id = ?
                ORDER BY rca.created_at DESC
                LIMIT ? OFFSET ?
            `, [id, parseInt(limit), offset]);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM role_change_audit WHERE user_id = ?',
                [id]
            );

            return res.status(status.OK).json(
                paginatedResponse('Role change history', history, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get role change history error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get pending role approvals
     * @route GET /api/v1/users/role-approvals/pending
     * @access Private (Super Admin)
     */
    async getPendingRoleApprovals(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [approvals] = await User.db.query(`
                SELECT rar.*, 
                       u1.username as user_username,
                       u1.email as user_email,
                       u2.username as requester_username
                FROM role_approval_requests rar
                JOIN users u1 ON rar.user_id = u1.id
                JOIN users u2 ON rar.requester_id = u2.id
                WHERE rar.status = 'pending' AND rar.expires_at > NOW()
                ORDER BY rar.created_at DESC
                LIMIT ? OFFSET ?
            `, [parseInt(limit), offset]);

            const [count] = await User.db.query(
                `SELECT COUNT(*) as total FROM role_approval_requests 
                 WHERE status = 'pending' AND expires_at > NOW()`
            );

            return res.status(status.OK).json(
                paginatedResponse('Pending role approvals', approvals, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get pending role approvals error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ==================== NEW FEATURE 2: MANUAL MFA SYSTEM ====================

    /**
     * Generate TOTP secret key (RFC 6238 compliant)
     * @returns {string} Base32 encoded secret
     */
    _generateTOTPSecret() {
        try {
            // Generate 20 random bytes (160 bits) as recommended by RFC 4226
            const randomBytes = crypto.randomBytes(20);
            // Convert to Base32 (RFC 4648)
            const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let bits = 0;
            let value = 0;
            let secret = '';

            for (let i = 0; i < randomBytes.length; i++) {
                value = (value << 8) | randomBytes[i];
                bits += 8;

                while (bits >= 5) {
                    secret += base32Chars[(value >>> (bits - 5)) & 31];
                    bits -= 5;
                }
            }

            if (bits > 0) {
                secret += base32Chars[(value << (5 - bits)) & 31];
            }

            // Ensure secret length is multiple of 8 for compatibility
            while (secret.length % 8 !== 0) {
                secret += '=';
            }

            return secret;
        } catch (error) {
            logger.error('Generate TOTP secret error', error);
            throw error;
        }
    }

    /**
     * Generate TOTP QR code as ASCII text
     * @param {string} secret - TOTP secret
     * @param {string} email - User email
     * @param {string} issuer - Application name
     * @returns {string} ASCII QR code representation
     */
    _generateTOTPQRCode(secret, email, issuer = 'MyApp') {
        try {
            // Generate otpauth URL
            const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

            // Simple ASCII QR code generator
            const qrModules = this._generateQRModules(otpauthUrl);
            return this._renderQRAsASCII(qrModules);
        } catch (error) {
            logger.error('Generate TOTP QR code error', error);
            return 'QR code generation failed';
        }
    }

    /**
     * Generate QR code modules
     * @param {string} data - Data to encode
     * @returns {Array} 2D array of modules
     */
    _generateQRModules(data) {
        // Simplified QR code generation for ASCII representation
        const size = 21; // Version 1 QR code
        const modules = Array(size).fill().map(() => Array(size).fill(false));

        // Add finder patterns
        this._addFinderPattern(modules, 0, 0);
        this._addFinderPattern(modules, size - 7, 0);
        this._addFinderPattern(modules, 0, size - 7);

        // Add timing patterns
        for (let i = 8; i < size - 8; i++) {
            modules[6][i] = i % 2 === 0;
            modules[i][6] = i % 2 === 0;
        }

        // Add dark module
        modules[size - 8][8] = true;

        // Simple data encoding (for demonstration)
        const dataBits = this._encodeDataToBits(data);
        this._placeDataBits(modules, dataBits);

        return modules;
    }

    /**
     * Add finder pattern to QR modules
     */
    _addFinderPattern(modules, x, y) {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                modules[x + i][y + j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
            }
        }
    }

    /**
     * Encode data to bits
     */
    _encodeDataToBits(data) {
        const bits = [];
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((charCode >> j) & 1);
            }
        }
        return bits;
    }

    /**
     * Place data bits in QR modules
     */
    _placeDataBits(modules, bits) {
        const size = modules.length;
        let bitIndex = 0;

        // Start from bottom-right corner, moving upward in zigzag pattern
        for (let right = size - 1; right >= 0; right -= 2) {
            if (right === 6) right = 5;

            // Upward column pair
            for (let vert = 0; vert < size; vert++) {
                for (let j = 0; j < 2; j++) {
                    const x = right - j;
                    if (!this._isFunctionModule(modules, x, vert) && bitIndex < bits.length) {
                        modules[x][vert] = bits[bitIndex] === 1;
                        bitIndex++;
                    }
                }
            }
        }
    }

    /**
     * Check if module is part of function pattern
     */
    _isFunctionModule(modules, x, y) {
        const size = modules.length;
        return x < 9 && y < 9 || // Top-left finder
               x > size - 9 && y < 9 || // Top-right finder
               x < 9 && y > size - 9 || // Bottom-left finder
               x === 6 || y === 6 || // Timing patterns
               x === size - 8 && y === 8; // Dark module
    }

    /**
     * Render QR modules as ASCII
     */
    _renderQRAsASCII(modules) {
        const size = modules.length;
        let ascii = '';
        const border = 2;

        // Add top border
        ascii += '┌' + '─'.repeat(size + border * 2) + '┐\n';

        // Add top padding
        for (let i = 0; i < border; i++) {
            ascii += '│' + ' '.repeat(size + border * 2) + '│\n';
        }

        // Render modules
        for (let y = 0; y < size; y++) {
            ascii += '│' + ' '.repeat(border);
            for (let x = 0; x < size; x++) {
                ascii += modules[x][y] ? '█' : ' ';
            }
            ascii += ' '.repeat(border) + '│\n';
        }

        // Add bottom padding
        for (let i = 0; i < border; i++) {
            ascii += '│' + ' '.repeat(size + border * 2) + '│\n';
        }

        // Add bottom border
        ascii += '└' + '─'.repeat(size + border * 2) + '┘\n';

        return ascii;
    }

    /**
     * Generate backup codes
     * @returns {Object} Backup codes object with plain and hashed codes
     */
    _generateBackupCodes() {
        try {
            const codes = [];
            const hashedCodes = [];

            for (let i = 0; i < this.backupCodeCount; i++) {
                // Generate 10-character alphanumeric code
                const code = crypto.randomBytes(6).toString('hex').toUpperCase();
                codes.push(code);

                // Hash the code for storage
                const hashed = crypto.createHash('sha256').update(code).digest('hex');
                hashedCodes.push(hashed);
            }

            return {
                plain: codes,
                hashed: hashedCodes
            };
        } catch (error) {
            logger.error('Generate backup codes error', error);
            throw error;
        }
    }

    /**
     * Verify TOTP code (RFC 6238)
     * @param {string} secret - TOTP secret
     * @param {string} code - User provided code
     * @param {number} window - Time window (default 1)
     * @returns {boolean} True if code is valid
     */
    _verifyTOTPCode(secret, code, window = 1) {
        try {
            // Decode Base32 secret
            const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            const cleanSecret = secret.replace(/=+$/, '').toUpperCase();
            let bits = 0;
            let value = 0;
            const bytes = [];

            for (let i = 0; i < cleanSecret.length; i++) {
                value = (value << 5) | base32Chars.indexOf(cleanSecret[i]);
                bits += 5;

                if (bits >= 8) {
                    bytes.push((value >>> (bits - 8)) & 255);
                    bits -= 8;
                }
            }

            const key = Buffer.from(bytes);

            // Calculate counter based on current time
            const timeStep = this.mfaStep;
            const counter = Math.floor(Date.now() / 1000 / timeStep);

            // Check code in window
            for (let i = -window; i <= window; i++) {
                const expectedCode = this._generateTOTPCode(key, counter + i);
                if (this._constantTimeCompare(code, expectedCode)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            logger.error('Verify TOTP code error', error);
            return false;
        }
    }

    /**
     * Generate TOTP code for specific counter
     */
    _generateTOTPCode(key, counter) {
        // Convert counter to 8-byte buffer
        const counterBuffer = Buffer.alloc(8);
        for (let i = 7; i >= 0; i--) {
            counterBuffer[i] = counter & 255;
            counter = counter >>> 8;
        }

        // Generate HMAC-SHA1
        const hmac = crypto.createHmac('sha1', key);
        hmac.update(counterBuffer);
        const hmacResult = hmac.digest();

        // Dynamic truncation (RFC 4226)
        const offset = hmacResult[hmacResult.length - 1] & 0xf;
        const binary =
            ((hmacResult[offset] & 0x7f) << 24) |
            ((hmacResult[offset + 1] & 0xff) << 16) |
            ((hmacResult[offset + 2] & 0xff) << 8) |
            (hmacResult[offset + 3] & 0xff);

        // Generate 6-digit code
        const code = binary % Math.pow(10, this.mfaCodeLength);
        return code.toString().padStart(this.mfaCodeLength, '0');
    }

    /**
     * Constant time comparison to prevent timing attacks
     */
    _constantTimeCompare(a, b) {
        if (a.length !== b.length) return false;

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }

    /**
     * Setup MFA for user
     * @route POST /api/v1/users/:id/mfa/setup
     * @access Private (Admin)
     */
    async setupMFA(req, res) {
        try {
            const { id } = req.params;
            const { method = 'totp' } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (user.two_factor_enabled) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('MFA is already enabled for this user')
                );
            }

            let result;
            switch (method) {
                case 'totp':
                    result = await this.setupTOTPMFA(user);
                    break;
                default:
                    return res.status(status.BAD_REQUEST).json(
                        errorResponse('Invalid MFA method')
                    );
            }

            logger.security('MFA_SETUP_INITIATED', {
                userId: id,
                method,
                adminId: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse('MFA setup initiated', result)
            );
        } catch (error) {
            logger.errorWithStack('Setup MFA error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Setup TOTP MFA
     */
    async setupTOTPMFA(user) {
        try {
            // Generate TOTP secret
            const secret = this._generateTOTPSecret();

            // Generate backup codes
            const backupCodes = this._generateBackupCodes();

            // Generate QR code ASCII
            const qrCode = this._generateTOTPQRCode(secret, user.email, config.APP_NAME || 'MyApp');

            // Store temporary MFA data
            const mfaData = {
                secret,
                backup_codes: backupCodes.hashed,
                verified: false,
                setup_at: new Date()
            };

            await User.db.query(`
                INSERT INTO user_mfa_temp (user_id, data, expires_at)
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
                ON DUPLICATE KEY UPDATE data = ?, expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)
            `, [user.id, JSON.stringify(mfaData), JSON.stringify(mfaData)]);

            return {
                secret,
                qr_code: qrCode,
                backup_codes: backupCodes.plain, // Return plain codes only once
                manual_entry_key: `otpauth://totp/${config.APP_NAME}:${user.email}?secret=${secret}&issuer=${config.APP_NAME}`,
                expires_in: 3600 // 1 hour
            };
        } catch (error) {
            logger.error('Setup TOTP MFA error', error);
            throw error;
        }
    }

    /**
     * Verify MFA setup
     * @route POST /api/v1/users/:id/mfa/verify
     * @access Private (Admin)
     */
    async verifyMFASetup(req, res) {
        try {
            const { id } = req.params;
            const { code, backup_code } = req.body;

            if (!code && !backup_code) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Code or backup code is required')
                );
            }

            // Get temporary MFA data
            const [tempData] = await User.db.query(`
                SELECT data FROM user_mfa_temp 
                WHERE user_id = ? AND expires_at > NOW()
            `, [id]);

            if (tempData.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('MFA setup session expired or not found')
                );
            }

            const mfaData = JSON.parse(tempData[0].data);
            let isValid = false;

            if (code) {
                // Verify TOTP code
                isValid = this._verifyTOTPCode(mfaData.secret, code);
            } else if (backup_code) {
                // Verify backup code
                const hashedCode = crypto.createHash('sha256').update(backup_code).digest('hex');
                isValid = mfaData.backup_codes.includes(hashedCode);

                if (isValid) {
                    // Remove used backup code
                    mfaData.backup_codes = mfaData.backup_codes.filter(h => h !== hashedCode);
                }
            }

            if (!isValid) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Invalid verification code')
                );
            }

            // Enable MFA for user
            await User.update(id, {
                two_factor_enabled: 1,
                two_factor_secret: mfaData.secret,
                two_factor_backup_codes: JSON.stringify(mfaData.backup_codes),
                two_factor_enabled_at: new Date(),
                two_factor_enabled_by: req.user?.id,
                updated_at: new Date()
            });

            // Clear temporary data
            await User.db.query('DELETE FROM user_mfa_temp WHERE user_id = ?', [id]);

            // Create trusted device if requested
            if (req.body.trust_device) {
                await this.addTrustedDevice(id, req);
            }

            logger.security('MFA_ENABLED', {
                userId: id,
                enabledBy: req.user?.id
            });

            return res.status(status.OK).json(
                successResponse('MFA enabled successfully', {
                    backup_codes_remaining: mfaData.backup_codes.length
                })
            );
        } catch (error) {
            logger.errorWithStack('Verify MFA setup error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Add trusted device
     */
    async addTrustedDevice(userId, req) {
        try {
            const deviceId = crypto.randomBytes(16).toString('hex');
            const fingerprint = this._generateDeviceFingerprint(req);

            await User.db.query(`
                INSERT INTO trusted_devices (
                    user_id, device_id, device_name, fingerprint, 
                    last_used, expires_at, created_at
                ) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?)
            `, [
                userId,
                deviceId,
                req.body.device_name || req.headers['user-agent'] || 'Unknown Device',
                JSON.stringify(fingerprint),
                new Date(),
                new Date()
            ]);

            return deviceId;
        } catch (error) {
            logger.error('Add trusted device error', error);
            throw error;
        }
    }

    /**
     * Generate device fingerprint
     */
    _generateDeviceFingerprint(req) {
        const fingerprint = {};
        
        this.sessionFingerprintFields.forEach(field => {
            switch (field) {
                case 'user-agent':
                    fingerprint.userAgent = req.headers['user-agent'] || '';
                    break;
                case 'accept-language':
                    fingerprint.acceptLanguage = req.headers['accept-language'] || '';
                    break;
                case 'timezone':
                    fingerprint.timezone = req.body.timezone || req.headers['timezone'] || '';
                    break;
                case 'screen-resolution':
                    fingerprint.screenResolution = req.body.screen_resolution || '';
                    break;
                case 'platform':
                    fingerprint.platform = req.body.platform || '';
                    break;
                case 'language':
                    fingerprint.language = req.headers['accept-language']?.split(',')[0] || '';
                    break;
            }
        });

        // Add IP address
        fingerprint.ip = req.ip || req.connection.remoteAddress;
        
        // Add geolocation data if available
        if (req.headers['x-forwarded-for']) {
            fingerprint.forwardedFor = req.headers['x-forwarded-for'];
        }

        return fingerprint;
    }

    /**
     * Disable MFA for user
     * @route POST /api/v1/users/:id/mfa/disable
     * @access Private (Admin)
     */
    async disableMFA(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (!user.two_factor_enabled) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('MFA is not enabled for this user')
                );
            }

            // Verify admin has permission to disable MFA
            if (!await this.canManageRole(req.user.role, user.role)) {
                return res.status(status.FORBIDDEN).json(
                    errorResponse('You do not have permission to disable MFA for this user')
                );
            }

            await User.update(id, {
                two_factor_enabled: 0,
                two_factor_secret: null,
                two_factor_backup_codes: null,
                two_factor_disabled_at: new Date(),
                two_factor_disabled_by: req.user.id,
                two_factor_disable_reason: reason,
                updated_at: new Date()
            });

            // Clear all trusted devices
            await User.db.query('DELETE FROM trusted_devices WHERE user_id = ?', [id]);

            logger.security('MFA_DISABLED', {
                userId: id,
                disabledBy: req.user.id,
                reason
            });

            return res.status(status.OK).json(
                successResponse('MFA disabled successfully')
            );
        } catch (error) {
            logger.errorWithStack('Disable MFA error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get MFA status
     * @route GET /api/v1/users/:id/mfa/status
     * @access Private (Admin)
     */
    async getMFAStatus(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const [trustedDevices] = await User.db.query(`
                SELECT device_id, device_name, last_used, expires_at
                FROM trusted_devices
                WHERE user_id = ? AND expires_at > NOW()
                ORDER BY last_used DESC
                LIMIT 10
            `, [id]);

            const [recoveryAttempts] = await User.db.query(`
                SELECT COUNT(*) as count FROM mfa_recovery_attempts
                WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `, [id]);

            const status = {
                enabled: user.two_factor_enabled === 1,
                enabled_at: user.two_factor_enabled_at,
                enabled_by: user.two_factor_enabled_by,
                last_used: user.two_factor_last_used,
                trusted_devices_count: trustedDevices.length,
                trusted_devices: trustedDevices,
                recovery_attempts_24h: recoveryAttempts[0].count,
                backup_codes_remaining: user.two_factor_backup_codes 
                    ? JSON.parse(user.two_factor_backup_codes).length 
                    : 0
            };

            return res.status(status.OK).json(
                successResponse('MFA status retrieved', status)
            );
        } catch (error) {
            logger.errorWithStack('Get MFA status error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Regenerate backup codes
     * @route POST /api/v1/users/:id/mfa/regenerate-backup-codes
     * @access Private (Admin)
     */
    async regenerateBackupCodes(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (!user.two_factor_enabled) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('MFA is not enabled for this user')
                );
            }

            // Generate new backup codes
            const backupCodes = this._generateBackupCodes();

            // Update user with new backup codes
            await User.update(id, {
                two_factor_backup_codes: JSON.stringify(backupCodes.hashed),
                backup_codes_regenerated_at: new Date(),
                backup_codes_regenerated_by: req.user.id,
                updated_at: new Date()
            });

            logger.security('BACKUP_CODES_REGENERATED', {
                userId: id,
                regeneratedBy: req.user.id
            });

            return res.status(status.OK).json(
                successResponse('Backup codes regenerated', {
                    backup_codes: backupCodes.plain // Return plain codes only once
                })
            );
        } catch (error) {
            logger.errorWithStack('Regenerate backup codes error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Initiate MFA recovery
     * @route POST /api/v1/users/mfa/recover
     * @access Public
     */
    async initiateMFARecovery(req, res) {
        try {
            const { email, phone, method } = req.body;

            if (!email && !phone) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Email or phone is required')
                );
            }

            // Find user by email or phone
            let user;
            if (email) {
                user = await User.findByEmail(email);
            } else {
                user = await User.findByPhone(phone);
            }

            if (!user) {
                // Return generic message for security
                return res.status(status.OK).json(
                    successResponse('If an account exists with this email/phone, recovery instructions have been sent')
                );
            }

            if (!user.two_factor_enabled) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('MFA is not enabled for this account')
                );
            }

            // Check rate limiting
            const isRateLimited = await this.checkMFARecoveryRateLimit(user.id);
            if (isRateLimited) {
                return res.status(status.TOO_MANY_REQUESTS).json(
                    errorResponse('Too many recovery attempts. Please try again later.')
                );
            }

            // Generate recovery token
            const recoveryToken = crypto.randomBytes(32).toString('hex');
            const recoveryTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Store recovery token
            await User.db.query(`
                INSERT INTO mfa_recovery_tokens (user_id, token, method, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)
            `, [user.id, recoveryToken, method || 'email', recoveryTokenExpiry, new Date()]);

            // Send recovery instructions
            switch (method) {
                case 'email':
                    await emailService.sendMFARecoveryEmail({
                        to: user.email,
                        username: user.username,
                        recoveryToken,
                        expiryMinutes: 15
                    });
                    break;
                case 'sms':
                    if (user.phone) {
                        await smsService.sendMFARecoverySMS({
                            phone: user.phone,
                            recoveryToken
                        });
                    }
                    break;
                default:
                    // Default to email
                    await emailService.sendMFARecoveryEmail({
                        to: user.email,
                        username: user.username,
                        recoveryToken,
                        expiryMinutes: 15
                    });
            }

            // Log recovery attempt
            await this.logMFARecoveryAttempt(user.id, req.ip, method);

            return res.status(status.OK).json(
                successResponse('Recovery instructions sent', {
                    method: method || 'email',
                    expires_in: 900 // 15 minutes in seconds
                })
            );
        } catch (error) {
            logger.errorWithStack('Initiate MFA recovery error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Check MFA recovery rate limit
     */
    async checkMFARecoveryRateLimit(userId) {
        try {
            const [attempts] = await User.db.query(`
                SELECT COUNT(*) as count FROM mfa_recovery_attempts
                WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `, [userId]);

            return attempts[0].count >= 5; // Max 5 attempts per hour
        } catch (error) {
            logger.error('Check MFA recovery rate limit error', error);
            return true; // Fail safe
        }
    }

    /**
     * Log MFA recovery attempt
     */
    async logMFARecoveryAttempt(userId, ip, method) {
        try {
            await User.db.query(`
                INSERT INTO mfa_recovery_attempts (user_id, ip_address, method, created_at)
                VALUES (?, ?, ?, ?)
            `, [userId, ip, method, new Date()]);
        } catch (error) {
            logger.error('Log MFA recovery attempt error', error);
        }
    }

    /**
     * Complete MFA recovery
     * @route POST /api/v1/users/mfa/recover/complete
     * @access Public
     */
    async completeMFARecovery(req, res) {
        try {
            const { recovery_token, backup_code } = req.body;

            if (!recovery_token || !backup_code) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Recovery token and backup code are required')
                );
            }

            // Validate recovery token
            const [tokens] = await User.db.query(`
                SELECT * FROM mfa_recovery_tokens
                WHERE token = ? AND expires_at > NOW() AND used = 0
            `, [recovery_token]);

            if (tokens.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Invalid or expired recovery token')
                );
            }

            const token = tokens[0];
            const user = await User.findById(token.user_id);

            if (!user || !user.two_factor_enabled) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Invalid recovery request')
                );
            }

            // Verify backup code
            const hashedCode = crypto.createHash('sha256').update(backup_code).digest('hex');
            const backupCodes = user.two_factor_backup_codes ? JSON.parse(user.two_factor_backup_codes) : [];

            if (!backupCodes.includes(hashedCode)) {
                // Mark token as used even on failure for security
                await User.db.query('UPDATE mfa_recovery_tokens SET used = 1 WHERE id = ?', [token.id]);
                
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Invalid backup code')
                );
            }

            // Remove used backup code
            const updatedBackupCodes = backupCodes.filter(h => h !== hashedCode);
            
            // Update user - disable MFA temporarily
            await User.update(user.id, {
                two_factor_enabled: 0,
                two_factor_backup_codes: JSON.stringify(updatedBackupCodes),
                mfa_recovery_used_at: new Date(),
                updated_at: new Date()
            });

            // Mark token as used
            await User.db.query('UPDATE mfa_recovery_tokens SET used = 1, used_at = ? WHERE id = ?', [new Date(), token.id]);

            // Generate temporary login token
            const loginToken = jwt.sign(
                { userId: user.id, recovery: true },
                config.SECURITY.JWT.SECRET,
                { expiresIn: '15m' }
            );

            logger.security('MFA_RECOVERY_COMPLETED', {
                userId: user.id,
                recoveryMethod: token.method
            });

            return res.status(status.OK).json(
                successResponse('MFA recovery completed', {
                    login_token: loginToken,
                    requires_mfa_setup: true,
                    backup_codes_remaining: updatedBackupCodes.length
                })
            );
        } catch (error) {
            logger.errorWithStack('Complete MFA recovery error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ==================== NEW FEATURE 3: ADVANCED SESSION MANAGEMENT ====================

    /**
     * Detect suspicious activity
     * @param {number} userId - User ID
     * @param {Object} sessionData - New session data
     * @returns {Object} Suspicious activity detection results
     */
    async _detectSuspiciousActivity(userId, sessionData) {
        try {
            const results = {
                isSuspicious: false,
                reasons: [],
                confidence: 0
            };

            // Get user's recent sessions
            const [recentSessions] = await User.db.query(`
                SELECT ip_address, device, user_agent, location, created_at
                FROM user_sessions
                WHERE user_id = ? AND expires_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY created_at DESC
                LIMIT 10
            `, [userId]);

            if (recentSessions.length === 0) {
                return results; // No previous sessions to compare
            }

            // Check for new IP address
            const previousIPs = [...new Set(recentSessions.map(s => s.ip_address))];
            if (!previousIPs.includes(sessionData.ip_address)) {
                results.reasons.push('new_ip_address');
                results.confidence += 30;
            }

            // Check for new device
            const previousDevices = [...new Set(recentSessions.map(s => s.device).filter(Boolean))];
            if (sessionData.device && !previousDevices.includes(sessionData.device)) {
                results.reasons.push('new_device');
                results.confidence += 25;
            }

            // Check for unusual location (simplified - in real app, use geolocation API)
            if (sessionData.location) {
                const previousLocations = [...new Set(recentSessions.map(s => s.location).filter(Boolean))];
                if (!previousLocations.includes(sessionData.location)) {
                    results.reasons.push('new_location');
                    results.confidence += 35;
                }
            }

            // Check time of day pattern (simplified)
            const loginHour = new Date().getHours();
            const usualHours = recentSessions.map(s => new Date(s.created_at).getHours());
            const hourAverage = usualHours.reduce((a, b) => a + b, 0) / usualHours.length;
            
            if (Math.abs(loginHour - hourAverage) > 4) { // More than 4 hours difference
                results.reasons.push('unusual_login_time');
                results.confidence += 10;
            }

            // Check user agent changes
            const previousUserAgents = [...new Set(recentSessions.map(s => s.user_agent).filter(Boolean))];
            if (sessionData.user_agent && !previousUserAgents.includes(sessionData.user_agent)) {
                results.reasons.push('new_user_agent');
                results.confidence += 20;
            }

            results.isSuspicious = results.confidence >= 50; // Threshold for suspicious activity

            // Log suspicious activity
            if (results.isSuspicious) {
                await this._createAuditLog(userId, 'SUSPICIOUS_ACTIVITY_DETECTED', {
                    reasons: results.reasons,
                    confidence: results.confidence,
                    sessionData,
                    detectedAt: new Date()
                });

                // Send alert if configured
                await this.sendSuspiciousActivityAlert(userId, results);
            }

            return results;
        } catch (error) {
            logger.error('Detect suspicious activity error', error);
            return { isSuspicious: false, reasons: [], confidence: 0 };
        }
    }

    /**
     * Send suspicious activity alert
     */
    async sendSuspiciousActivityAlert(userId, detectionResults) {
        try {
            const [user] = await User.db.query('SELECT email, username FROM users WHERE id = ?', [userId]);
            if (!user[0]) return;

            // Check user preferences
            const [prefs] = await User.db.query(
                'SELECT login_alerts FROM user_security_settings WHERE user_id = ?',
                [userId]
            );

            const sendAlerts = !prefs[0] || prefs[0].login_alerts !== 0;

            if (sendAlerts) {
                await emailService.sendSuspiciousActivityAlert({
                    to: user[0].email,
                    username: user[0].username,
                    reasons: detectionResults.reasons,
                    confidence: detectionResults.confidence,
                    time: new Date().toLocaleString(),
                    ip: detectionResults.sessionData?.ip_address || 'Unknown'
                });
            }
        } catch (error) {
            logger.error('Send suspicious activity alert error', error);
        }
    }

    /**
     * Create audit log
     */
    async _createAuditLog(userId, action, metadata = {}) {
        try {
            await User.db.query(`
                INSERT INTO audit_logs (user_id, action, metadata, created_at)
                VALUES (?, ?, ?, ?)
            `, [userId, action, JSON.stringify(metadata), new Date()]);
        } catch (error) {
            logger.error('Create audit log error', error);
        }
    }

    /**
     * Get user sessions with filtering
     * @route GET /api/v1/users/:id/sessions
     * @access Private (Admin)
     */
    async getUserSessions(req, res) {
        try {
            const { id } = req.params;
            const {
                page = 1,
                limit = 20,
                active_only = false,
                start_date,
                end_date,
                device,
                ip
            } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const offset = (page - 1) * limit;
            let query = `
                SELECT id, device, ip_address, user_agent, location, 
                       created_at, expires_at, last_activity,
                       CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END as is_active
                FROM user_sessions
                WHERE user_id = ?
            `;
            const params = [id];

            if (active_only === 'true') {
                query += ' AND expires_at > NOW()';
            }

            if (start_date) {
                query += ' AND created_at >= ?';
                params.push(new Date(start_date));
            }

            if (end_date) {
                query += ' AND created_at <= ?';
                params.push(new Date(end_date));
            }

            if (device) {
                query += ' AND device LIKE ?';
                params.push(`%${device}%`);
            }

            if (ip) {
                query += ' AND ip_address LIKE ?';
                params.push(`%${ip}%`);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [sessions] = await User.db.query(query, params);

            const [countResult] = await User.db.query(
                `SELECT COUNT(*) as total FROM user_sessions WHERE user_id = ?`,
                [id]
            );

            // Add suspicious activity flags
            const enhancedSessions = await Promise.all(
                sessions.map(async session => {
                    const suspicious = await this._detectSuspiciousActivity(id, {
                        ip_address: session.ip_address,
                        device: session.device,
                        user_agent: session.user_agent,
                        location: session.location
                    });
                    
                    return {
                        ...session,
                        suspicious: suspicious.isSuspicious,
                        suspicious_reasons: suspicious.reasons
                    };
                })
            );

            return res.status(status.OK).json(
                paginatedResponse('User sessions', enhancedSessions, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit),
                    active_count: sessions.filter(s => s.is_active).length
                })
            );
        } catch (error) {
            logger.errorWithStack('Get user sessions error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Terminate user session
     * @route DELETE /api/v1/users/:id/sessions/:sessionId
     * @access Private (Admin)
     */
    async terminateUserSession(req, res) {
        try {
            const { id, sessionId } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // Verify session belongs to user
            const [sessions] = await User.db.query(
                'SELECT * FROM user_sessions WHERE id = ? AND user_id = ?',
                [sessionId, id]
            );

            if (sessions.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Session not found')
                );
            }

            // Terminate session
            await User.db.query(
                'UPDATE user_sessions SET expires_at = NOW() WHERE id = ?',
                [sessionId]
            );

            // Log the action
            await this._createAuditLog(id, 'SESSION_TERMINATED_BY_ADMIN', {
                session_id: sessionId,
                terminated_by: req.user.id,
                session_data: sessions[0]
            });

            logger.security('USER_SESSION_TERMINATED', {
                userId: id,
                sessionId,
                terminatedBy: req.user.id
            });

            return res.status(status.OK).json(
                successResponse('Session terminated successfully')
            );
        } catch (error) {
            logger.errorWithStack('Terminate user session error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Terminate all user sessions
     * @route POST /api/v1/users/:id/sessions/terminate-all
     * @access Private (Admin)
     */
    async terminateAllUserSessions(req, res) {
        try {
            const { id } = req.params;
            const { exclude_current = false } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            let query = 'UPDATE user_sessions SET expires_at = NOW() WHERE user_id = ?';
            const params = [id];

            if (exclude_current && req.session?.id) {
                query += ' AND id != ?';
                params.push(req.session.id);
            }

            const [result] = await User.db.query(query, params);
            const affectedRows = result.affectedRows || 0;

            // Log the action
            await this._createAuditLog(id, 'ALL_SESSIONS_TERMINATED', {
                terminated_by: req.user.id,
                excluded_current: exclude_current,
                sessions_terminated: affectedRows
            });

            // Send notification to user
            await this.createNotification(id, {
                type: 'security',
                title: 'All Sessions Terminated',
                message: 'All your active sessions have been terminated by an administrator.',
                priority: 'high'
            });

            logger.security('ALL_USER_SESSIONS_TERMINATED', {
                userId: id,
                terminatedBy: req.user.id,
                sessionsTerminated: affectedRows
            });

            return res.status(status.OK).json(
                successResponse('All sessions terminated successfully', {
                    sessions_terminated: affectedRows
                })
            );
        } catch (error) {
            logger.errorWithStack('Terminate all user sessions error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get session statistics
     * @route GET /api/v1/users/:id/sessions/stats
     * @access Private (Admin)
     */
    async getSessionStats(req, res) {
        try {
            const { id } = req.params;
            const { period = '30d' } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const dateFilter = this.getDateFilter(period);

            const [
                totalSessions,
                activeSessions,
                uniqueDevices,
                uniqueIPs,
                suspiciousSessions,
                sessionDuration,
                deviceBreakdown,
                locationBreakdown
            ] = await Promise.all([
                // Total sessions
                User.db.query(
                    'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND created_at >= ?',
                    [id, dateFilter]
                ),
                // Active sessions
                User.db.query(
                    'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND expires_at > NOW()',
                    [id]
                ),
                // Unique devices
                User.db.query(
                    'SELECT COUNT(DISTINCT device) as count FROM user_sessions WHERE user_id = ? AND created_at >= ? AND device IS NOT NULL',
                    [id, dateFilter]
                ),
                // Unique IPs
                User.db.query(
                    'SELECT COUNT(DISTINCT ip_address) as count FROM user_sessions WHERE user_id = ? AND created_at >= ?',
                    [id, dateFilter]
                ),
                // Suspicious sessions
                User.db.query(`
                    SELECT COUNT(*) as count FROM audit_logs 
                    WHERE user_id = ? AND action = 'SUSPICIOUS_ACTIVITY_DETECTED' 
                    AND created_at >= ?
                `, [id, dateFilter]),
                // Average session duration
                User.db.query(`
                    SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, expires_at)) as avg_duration
                    FROM user_sessions 
                    WHERE user_id = ? AND expires_at IS NOT NULL AND created_at >= ?
                `, [id, dateFilter]),
                // Device breakdown
                User.db.query(`
                    SELECT device, COUNT(*) as count, 
                           MAX(created_at) as last_used
                    FROM user_sessions
                    WHERE user_id = ? AND created_at >= ? AND device IS NOT NULL
                    GROUP BY device
                    ORDER BY count DESC
                    LIMIT 5
                `, [id, dateFilter]),
                // Location breakdown
                User.db.query(`
                    SELECT location, COUNT(*) as count,
                           MAX(created_at) as last_used
                    FROM user_sessions
                    WHERE user_id = ? AND created_at >= ? AND location IS NOT NULL
                    GROUP BY location
                    ORDER BY count DESC
                    LIMIT 5
                `, [id, dateFilter])
            ]);

            const stats = {
                period,
                total_sessions: totalSessions[0][0].count,
                active_sessions: activeSessions[0][0].count,
                unique_devices: uniqueDevices[0][0].count,
                unique_ips: uniqueIPs[0][0].count,
                suspicious_sessions: suspiciousSessions[0][0].count,
                avg_session_duration_minutes: Math.round(sessionDuration[0][0].avg_duration || 0),
                device_breakdown: deviceBreakdown[0],
                location_breakdown: locationBreakdown[0],
                generated_at: new Date().toISOString()
            };

            return res.status(status.OK).json(
                successResponse('Session statistics retrieved', stats)
            );
        } catch (error) {
            logger.errorWithStack('Get session stats error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get session map visualization data
     * @route GET /api/v1/users/:id/sessions/map
     * @access Private (Admin)
     */
    async getSessionMapData(req, res) {
        try {
            const { id } = req.params;
            const { limit = 100 } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // Get sessions with IP addresses
            const [sessions] = await User.db.query(`
                SELECT ip_address, location, created_at, device, user_agent,
                       COUNT(*) as login_count,
                       MIN(created_at) as first_seen,
                       MAX(created_at) as last_seen
                FROM user_sessions
                WHERE user_id = ? AND ip_address IS NOT NULL
                GROUP BY ip_address, location
                ORDER BY last_seen DESC
                LIMIT ?
            `, [id, parseInt(limit)]);

            // Convert to map data format
            const mapData = sessions.map(session => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: this._ipToCoordinates(session.ip_address) // Mock function
                },
                properties: {
                    ip: session.ip_address,
                    location: session.location || 'Unknown',
                    login_count: session.login_count,
                    first_seen: session.first_seen,
                    last_seen: session.last_seen,
                    device: session.device || 'Unknown',
                    user_agent: session.user_agent || 'Unknown'
                }
            }));

            return res.status(status.OK).json(
                successResponse('Session map data retrieved', {
                    type: 'FeatureCollection',
                    features: mapData,
                    total_locations: sessions.length
                })
            );
        } catch (error) {
            logger.errorWithStack('Get session map data error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Mock IP to coordinates conversion
     */
    _ipToCoordinates(ip) {
        // In a real application, use a geolocation service or database
        // This is a mock implementation that generates random coordinates
        const hash = crypto.createHash('md5').update(ip).digest('hex');
        const lon = (parseInt(hash.substr(0, 8), 16) / 0xffffffff) * 360 - 180;
        const lat = (parseInt(hash.substr(8, 8), 16) / 0xffffffff) * 180 - 90;
        return [lon, lat];
    }

    /**
     * Enforce concurrent session limits
     * @param {number} userId - User ID
     * @param {string} role - User role
     * @returns {Promise<boolean>} True if session creation is allowed
     */
    async enforceSessionLimits(userId, role) {
        try {
            // Get session limits based on role
            const sessionLimits = {
                'super_admin': 10,
                'admin': 5,
                'manager': 3,
                'user': 2,
                'guest': 1
            };

            const limit = sessionLimits[role] || 1;

            // Count active sessions
            const [activeSessions] = await User.db.query(
                'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND expires_at > NOW()',
                [userId]
            );

            const currentCount = activeSessions[0].count;

            if (currentCount >= limit) {
                // Terminate oldest session
                const [oldestSession] = await User.db.query(`
                    SELECT id FROM user_sessions 
                    WHERE user_id = ? AND expires_at > NOW()
                    ORDER BY created_at ASC
                    LIMIT 1
                `, [userId]);

                if (oldestSession.length > 0) {
                    await User.db.query(
                        'UPDATE user_sessions SET expires_at = NOW() WHERE id = ?',
                        [oldestSession[0].id]
                    );

                    logger.info('Terminated oldest session due to limit', {
                        userId,
                        role,
                        limit,
                        terminatedSession: oldestSession[0].id
                    });
                }

                // Log the enforcement
                await this._createAuditLog(userId, 'SESSION_LIMIT_ENFORCED', {
                    role,
                    limit,
                    previous_count: currentCount,
                    terminated_session: oldestSession[0]?.id
                });
            }

            return true;
        } catch (error) {
            logger.error('Enforce session limits error', error);
            return true; // Allow session creation on error
        }
    }

    /**
     * Update session activity
     * @param {string} sessionId - Session ID
     */
    async updateSessionActivity(sessionId) {
        try {
            await User.db.query(
                'UPDATE user_sessions SET last_activity = NOW() WHERE id = ?',
                [sessionId]
            );
        } catch (error) {
            logger.error('Update session activity error', error);
        }
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const [result] = await User.db.query(`
                DELETE FROM user_sessions 
                WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)
            `);

            if (result.affectedRows > 0) {
                logger.info(`Cleaned up ${result.affectedRows} expired sessions`);
            }

            return result.affectedRows;
        } catch (error) {
            logger.error('Cleanup expired sessions error', error);
            return 0;
        }
    }

    /**
     * Get session analytics
     * @route GET /api/v1/users/sessions/analytics
     * @access Private (Admin)
     */
    async getSessionAnalytics(req, res) {
        try {
            const { period = '7d', group_by = 'day' } = req.query;

            const dateFilter = this.getDateFilter(period);

            const [
                totalSessions,
                activeSessions,
                uniqueUsers,
                avgDuration,
                deviceDistribution,
                locationDistribution,
                hourlyPattern,
                suspiciousActivity
            ] = await Promise.all([
                // Total sessions
                User.db.query(
                    'SELECT COUNT(*) as count FROM user_sessions WHERE created_at >= ?',
                    [dateFilter]
                ),
                // Currently active sessions
                User.db.query(
                    'SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > NOW()'
                ),
                // Unique users with sessions
                User.db.query(
                    'SELECT COUNT(DISTINCT user_id) as count FROM user_sessions WHERE created_at >= ?',
                    [dateFilter]
                ),
                // Average session duration
                User.db.query(`
                    SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, expires_at)) as avg_duration
                    FROM user_sessions 
                    WHERE expires_at IS NOT NULL AND created_at >= ?
                `, [dateFilter]),
                // Device distribution
                User.db.query(`
                    SELECT device, COUNT(*) as count,
                           COUNT(DISTINCT user_id) as unique_users
                    FROM user_sessions
                    WHERE created_at >= ? AND device IS NOT NULL
                    GROUP BY device
                    ORDER BY count DESC
                    LIMIT 10
                `, [dateFilter]),
                // Location distribution
                User.db.query(`
                    SELECT location, COUNT(*) as count,
                           COUNT(DISTINCT user_id) as unique_users
                    FROM user_sessions
                    WHERE created_at >= ? AND location IS NOT NULL
                    GROUP BY location
                    ORDER BY count DESC
                    LIMIT 10
                `, [dateFilter]),
                // Hourly pattern
                User.db.query(`
                    SELECT HOUR(created_at) as hour, COUNT(*) as count
                    FROM user_sessions
                    WHERE created_at >= ?
                    GROUP BY HOUR(created_at)
                    ORDER BY hour
                `, [dateFilter]),
                // Suspicious activity
                User.db.query(`
                    SELECT DATE(created_at) as date, COUNT(*) as count
                    FROM audit_logs
                    WHERE action = 'SUSPICIOUS_ACTIVITY_DETECTED' AND created_at >= ?
                    GROUP BY DATE(created_at)
                    ORDER BY date
                `, [dateFilter])
            ]);

            const analytics = {
                period,
                total_sessions: totalSessions[0][0].count,
                active_sessions: activeSessions[0][0].count,
                unique_users: uniqueUsers[0][0].count,
                avg_session_duration_minutes: Math.round(avgDuration[0][0].avg_duration || 0),
                device_distribution: deviceDistribution[0],
                location_distribution: locationDistribution[0],
                hourly_pattern: hourlyPattern[0],
                suspicious_activity: suspiciousActivity[0],
                generated_at: new Date().toISOString()
            };

            return res.status(status.OK).json(
                successResponse('Session analytics retrieved', analytics)
            );
        } catch (error) {
            logger.errorWithStack('Get session analytics error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ==================== NEW FEATURE 4: REPORT ENGINE ====================

    /**
     * Generate user growth report
     * @route GET /api/v1/users/reports/growth
     * @access Private (Admin)
     */
    async generateGrowthReport(req, res) {
        try {
            const {
                period = '30d',
                frequency = 'daily',
                include_inactive = false,
                format = 'json'
            } = req.query;

            const dateFilter = this.getDateFilter(period);
            let groupByClause;

            switch (frequency) {
                case 'hourly':
                    groupByClause = 'DATE_FORMAT(created_at, "%Y-%m-%d %H:00")';
                    break;
                case 'daily':
                    groupByClause = 'DATE(created_at)';
                    break;
                case 'weekly':
                    groupByClause = 'YEARWEEK(created_at)';
                    break;
                case 'monthly':
                    groupByClause = 'DATE_FORMAT(created_at, "%Y-%m")';
                    break;
                default:
                    groupByClause = 'DATE(created_at)';
            }

            let query = `
                SELECT ${groupByClause} as period,
                       COUNT(*) as new_users,
                       SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users,
                       SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                       MIN(created_at) as period_start,
                       MAX(created_at) as period_end
                FROM users
                WHERE created_at >= ?
            `;

            const params = [dateFilter];

            if (include_inactive !== 'true') {
                query += ' AND is_active = 1';
            }

            query += ` GROUP BY ${groupByClause} ORDER BY period`;

            const [growthData] = await User.db.query(query, params);

            // Calculate cumulative totals
            let cumulativeTotal = 0;
            const reportData = growthData.map(row => {
                cumulativeTotal += row.new_users;
                return {
                    ...row,
                    cumulative_total: cumulativeTotal,
                    verification_rate: row.new_users > 0 ? (row.verified_users / row.new_users * 100).toFixed(2) : 0,
                    activation_rate: row.new_users > 0 ? (row.active_users / row.new_users * 100).toFixed(2) : 0
                };
            });

            // Calculate summary statistics
            const summary = {
                total_period: reportData.reduce((sum, row) => sum + row.new_users, 0),
                avg_daily: reportData.length > 0 
                    ? (reportData.reduce((sum, row) => sum + row.new_users, 0) / reportData.length).toFixed(2)
                    : 0,
                peak_period: reportData.reduce((max, row) => row.new_users > max.new_users ? row : max, { new_users: 0 }),
                current_total: cumulativeTotal,
                verification_rate_overall: reportData.reduce((sum, row) => sum + row.verified_users, 0) / 
                                          (reportData.reduce((sum, row) => sum + row.new_users, 0) || 1) * 100,
                generated_at: new Date().toISOString()
            };

            const report = {
                metadata: {
                    period,
                    frequency,
                    date_generated: new Date().toISOString(),
                    generated_by: req.user.id
                },
                summary,
                data: reportData
            };

            // Export based on format
            if (format === 'csv') {
                return this.exportReportToCSV(res, reportData, 'user_growth_report');
            } else if (format === 'pdf') {
                return this.exportReportToPDF(res, report, 'user_growth_report');
            } else if (format === 'html') {
                return this.exportReportToHTML(res, report, 'user_growth_report');
            }

            return res.status(status.OK).json(
                successResponse('Growth report generated', report)
            );
        } catch (error) {
            logger.errorWithStack('Generate growth report error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Generate admin activity report
     * @route GET /api/v1/users/reports/admin-activity
     * @access Private (Admin)
     */
    async generateAdminActivityReport(req, res) {
        try {
            const {
                period = '7d',
                admin_id,
                action_type,
                format = 'json'
            } = req.query;

            const dateFilter = this.getDateFilter(period);

            let query = `
                SELECT al.id, al.user_id, al.action, al.metadata, al.created_at,
                       u.username as admin_username, u.email as admin_email,
                       u.role as admin_role
                FROM audit_logs al
                JOIN users u ON al.user_id = u.id
                WHERE al.created_at >= ? AND u.role IN ('admin', 'super_admin')
            `;

            const params = [dateFilter];

            if (admin_id) {
                query += ' AND al.user_id = ?';
                params.push(admin_id);
            }

            if (action_type) {
                query += ' AND al.action LIKE ?';
                params.push(`%${action_type}%`);
            }

            query += ' ORDER BY al.created_at DESC LIMIT 1000';

            const [activityLogs] = await User.db.query(query, params);

            // Group by action type
            const actionSummary = activityLogs.reduce((acc, log) => {
                acc[log.action] = (acc[log.action] || 0) + 1;
                return acc;
            }, {});

            // Group by admin
            const adminSummary = activityLogs.reduce((acc, log) => {
                if (!acc[log.user_id]) {
                    acc[log.user_id] = {
                        username: log.admin_username,
                        email: log.admin_email,
                        role: log.admin_role,
                        total_actions: 0,
                        actions: {}
                    };
                }
                acc[log.user_id].total_actions++;
                acc[log.user_id].actions[log.action] = (acc[log.user_id].actions[log.action] || 0) + 1;
                return acc;
            }, {});

            // Calculate hourly distribution
            const hourlyDistribution = Array(24).fill(0);
            activityLogs.forEach(log => {
                const hour = new Date(log.created_at).getHours();
                hourlyDistribution[hour]++;
            });

            const report = {
                metadata: {
                    period,
                    date_generated: new Date().toISOString(),
                    generated_by: req.user.id,
                    total_actions: activityLogs.length
                },
                summary: {
                    total_actions: activityLogs.length,
                    unique_admins: Object.keys(adminSummary).length,
                    action_summary: actionSummary,
                    busiest_hour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution))
                },
                admin_summary: adminSummary,
                hourly_distribution: hourlyDistribution.map((count, hour) => ({ hour, count })),
                detailed_logs: activityLogs.map(log => ({
                    ...log,
                    metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata
                }))
            };

            // Export based on format
            if (format === 'csv') {
                return this.exportReportToCSV(res, activityLogs, 'admin_activity_report');
            }

            return res.status(status.OK).json(
                successResponse('Admin activity report generated', report)
            );
        } catch (error) {
            logger.errorWithStack('Generate admin activity report error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Generate user retention report
     * @route GET /api/v1/users/reports/retention
     * @access Private (Admin)
     */
    async generateRetentionReport(req, res) {
        try {
            const {
                cohort_period = 'monthly',
                periods_to_analyze = 6,
                format = 'json'
            } = req.query;

            const report = await this.calculateRetentionCohorts(cohort_period, periods_to_analyze);

            // Calculate churn analysis
            const churnAnalysis = await this.calculateChurnAnalysis();

            const fullReport = {
                metadata: {
                    cohort_period,
                    periods_analyzed: periods_to_analyze,
                    date_generated: new Date().toISOString(),
                    generated_by: req.user.id
                },
                retention_analysis: report,
                churn_analysis: churnAnalysis,
                recommendations: this.generateRetentionRecommendations(report, churnAnalysis)
            };

            // Export based on format
            if (format === 'csv') {
                const flatData = this.flattenRetentionData(report);
                return this.exportReportToCSV(res, flatData, 'retention_report');
            }

            return res.status(status.OK).json(
                successResponse('Retention report generated', fullReport)
            );
        } catch (error) {
            logger.errorWithStack('Generate retention report error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Calculate retention cohorts
     */
    async calculateRetentionCohorts(cohortPeriod, periodsToAnalyze) {
        try {
            let cohortGroupBy, periodInterval;
            
            switch (cohortPeriod) {
                case 'daily':
                    cohortGroupBy = 'DATE(created_at)';
                    periodInterval = 'DAY';
                    break;
                case 'weekly':
                    cohortGroupBy = 'YEARWEEK(created_at)';
                    periodInterval = 'WEEK';
                    break;
                case 'monthly':
                    cohortGroupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
                    periodInterval = 'MONTH';
                    break;
                default:
                    cohortGroupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
                    periodInterval = 'MONTH';
            }

            // Get cohorts
            const [cohorts] = await User.db.query(`
                SELECT ${cohortGroupBy} as cohort_period,
                       COUNT(*) as cohort_size
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? ${periodInterval})
                GROUP BY ${cohortGroupBy}
                ORDER BY cohort_period DESC
                LIMIT ?
            `, [periodsToAnalyze, periodsToAnalyze]);

            // Calculate retention for each cohort
            const retentionData = await Promise.all(
                cohorts.map(async (cohort) => {
                    const retention = [];
                    
                    for (let period = 0; period < periodsToAnalyze; period++) {
                        const [retainedUsers] = await User.db.query(`
                            SELECT COUNT(DISTINCT u.id) as retained_count
                            FROM users u
                            WHERE ${cohortGroupBy} = ?
                              AND EXISTS (
                                  SELECT 1 FROM user_logins ul
                                  WHERE ul.user_id = u.id
                                  AND ul.created_at >= DATE_ADD(
                                      STR_TO_DATE(?, ?),
                                      INTERVAL ? ${periodInterval}
                                  )
                                  AND ul.created_at < DATE_ADD(
                                      DATE_ADD(
                                          STR_TO_DATE(?, ?),
                                          INTERVAL ? ${periodInterval}
                                      ),
                                      INTERVAL 1 ${periodInterval}
                                  )
                              )
                        `, [
                            cohort.cohort_period,
                            cohort.cohort_period + (cohortPeriod === 'monthly' ? '-01' : ''),
                            cohortPeriod === 'monthly' ? '%Y-%m-%d' : '%Y-%m-%d',
                            period,
                            cohort.cohort_period + (cohortPeriod === 'monthly' ? '-01' : ''),
                            cohortPeriod === 'monthly' ? '%Y-%m-%d' : '%Y-%m-%d',
                            period + 1
                        ]);

                        retention.push({
                            period: period + 1,
                            retained_count: retainedUsers[0].retained_count,
                            retention_rate: (retainedUsers[0].retained_count / cohort.cohort_size * 100).toFixed(2)
                        });
                    }

                    return {
                        cohort_period: cohort.cohort_period,
                        cohort_size: cohort.cohort_size,
                        retention: retention
                    };
                })
            );

            return retentionData;
        } catch (error) {
            logger.error('Calculate retention cohorts error', error);
            return [];
        }
    }

    /**
     * Calculate churn analysis
     */
    async calculateChurnAnalysis() {
        try {
            const date30DaysAgo = new Date();
            date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

            const [
                totalUsers,
                activeUsers,
                churnedUsers,
                churnReasons,
                reactivatedUsers
            ] = await Promise.all([
                // Total users
                User.db.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1'),
                // Active in last 30 days
                User.db.query(
                    'SELECT COUNT(DISTINCT user_id) as count FROM user_logins WHERE created_at >= ?',
                    [date30DaysAgo]
                ),
                // Churned users (no activity in 30 days but were active before)
                User.db.query(`
                    SELECT COUNT(*) as count FROM users u
                    WHERE u.is_active = 1
                    AND NOT EXISTS (
                        SELECT 1 FROM user_logins ul
                        WHERE ul.user_id = u.id
                        AND ul.created_at >= ?
                    )
                    AND EXISTS (
                        SELECT 1 FROM user_logins ul2
                        WHERE ul2.user_id = u.id
                        AND ul2.created_at < ?
                    )
                `, [date30DaysAgo, date30DaysAgo]),
                // Churn reasons (from deletion/suspension records)
                User.db.query(`
                    SELECT 
                        COALESCE(deletion_reason, suspension_reason) as reason,
                        COUNT(*) as count
                    FROM users
                    WHERE (deleted_at >= ? OR suspended_at >= ?)
                    AND (deletion_reason IS NOT NULL OR suspension_reason IS NOT NULL)
                    GROUP BY COALESCE(deletion_reason, suspension_reason)
                    ORDER BY count DESC
                    LIMIT 10
                `, [date30DaysAgo, date30DaysAgo]),
                // Reactivated users
                User.db.query(`
                    SELECT COUNT(*) as count FROM users u
                    WHERE u.is_active = 1
                    AND EXISTS (
                        SELECT 1 FROM user_logins ul
                        WHERE ul.user_id = u.id
                        AND ul.created_at >= ?
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM user_logins ul2
                        WHERE ul2.user_id = u.id
                        AND ul2.created_at >= DATE_SUB(?, INTERVAL 60 DAY)
                        AND ul2.created_at < ?
                    )
                `, [date30DaysAgo, date30DaysAgo, date30DaysAgo])
            ]);

            const total = totalUsers[0][0].count;
            const active = activeUsers[0][0].count;
            const churned = churnedUsers[0][0].count;

            return {
                total_users: total,
                active_users: active,
                churned_users: churned,
                churn_rate: total > 0 ? (churned / total * 100).toFixed(2) : 0,
                activation_rate: total > 0 ? (active / total * 100).toFixed(2) : 0,
                churn_reasons: churnReasons[0],
                reactivated_users: reactivatedUsers[0][0].count,
                reactivation_rate: churned > 0 ? (reactivatedUsers[0][0].count / churned * 100).toFixed(2) : 0
            };
        } catch (error) {
            logger.error('Calculate churn analysis error', error);
            return {};
        }
    }

    /**
     * Generate retention recommendations
     */
    generateRetentionRecommendations(retentionData, churnAnalysis) {
        const recommendations = [];

        if (churnAnalysis.churn_rate > 10) {
            recommendations.push({
                priority: 'high',
                title: 'High Churn Rate Detected',
                description: `Churn rate is ${churnAnalysis.churn_rate}%. Consider implementing retention strategies.`,
                actions: [
                    'Review churn reasons in detail',
                    'Implement win-back campaigns',
                    'Improve onboarding process'
                ]
            });
        }

        if (retentionData.length > 0) {
            const latestCohort = retentionData[0];
            const firstMonthRetention = parseFloat(latestCohort.retention[0]?.retention_rate || 0);

            if (firstMonthRetention < 50) {
                recommendations.push({
                    priority: 'medium',
                    title: 'Low First-Month Retention',
                    description: `First-month retention is ${firstMonthRetention}%. Focus on early user engagement.`,
                    actions: [
                        'Send welcome email series',
                        'Offer onboarding tutorials',
                        'Provide early success incentives'
                    ]
                });
            }
        }

        if (churnAnalysis.reactivation_rate < 5) {
            recommendations.push({
                priority: 'low',
                title: 'Low Reactivation Rate',
                description: `Only ${churnAnalysis.reactivation_rate}% of churned users return. Consider re-engagement campaigns.`,
                actions: [
                    'Send re-engagement emails',
                    'Offer comeback incentives',
                    'Survey inactive users'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Flatten retention data for CSV export
     */
    flattenRetentionData(retentionData) {
        const flatData = [];
        
        retentionData.forEach(cohort => {
            cohort.retention.forEach(retention => {
                flatData.push({
                    cohort_period: cohort.cohort_period,
                    cohort_size: cohort.cohort_size,
                    retention_period: retention.period,
                    retained_count: retention.retained_count,
                    retention_rate: retention.retention_rate
                });
            });
        });

        return flatData;
    }

    /**
     * Export report to CSV
     */
    exportReportToCSV(res, data, filename) {
        if (!data || data.length === 0) {
            return res.status(status.OK).send('No data to export');
        }

        const headers = Object.keys(data[0]);
        const csvHeader = headers.join(',');
        const csvData = data.map(row => 
            headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}_${Date.now()}.csv`);
        return res.send(csvHeader + '\n' + csvData);
    }

    /**
     * Export report to PDF (simulated)
     */
    exportReportToPDF(res, report, filename) {
        // In a real application, use a PDF library like pdfkit
        // This is a simulated response
        return res.status(status.OK).json({
            success: true,
            message: 'PDF export simulated',
            data: {
                filename: `${filename}_${Date.now()}.pdf`,
                report: report.metadata,
                simulated: true
            }
        });
    }

    /**
     * Export report to HTML
     */
    exportReportToHTML(res, report, filename) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${filename}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #333; }
                    .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; }
                    .priority-high { border-left: 4px solid #dc3545; }
                    .priority-medium { border-left: 4px solid #ffc107; }
                    .priority-low { border-left: 4px solid #28a745; }
                </style>
            </head>
            <body>
                <h1>${filename.replace(/_/g, ' ').toUpperCase()}</h1>
                <div class="metadata">
                    <p><strong>Generated:</strong> ${report.metadata.date_generated}</p>
                    <p><strong>Generated by:</strong> User ID ${report.metadata.generated_by}</p>
                    ${report.metadata.period ? `<p><strong>Period:</strong> ${report.metadata.period}</p>` : ''}
                </div>
                ${report.summary ? `
                    <h2>Summary</h2>
                    <pre>${JSON.stringify(report.summary, null, 2)}</pre>
                ` : ''}
                ${report.recommendations ? `
                    <h2>Recommendations</h2>
                    ${report.recommendations.map(rec => `
                        <div class="recommendation priority-${rec.priority}">
                            <h3>${rec.title}</h3>
                            <p>${rec.description}</p>
                            <ul>${rec.actions.map(action => `<li>${action}</li>`).join('')}</ul>
                        </div>
                    `).join('')}
                ` : ''}
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}_${Date.now()}.html`);
        return res.send(html);
    }

    /**
     * Save report template
     * @route POST /api/v1/users/reports/templates
     * @access Private (Admin)
     */
    async saveReportTemplate(req, res) {
        try {
            const {
                name,
                type,
                parameters,
                schedule,
                recipients,
                format = 'json'
            } = req.body;

            if (!name || !type) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Name and type are required')
                );
            }

            const templateId = crypto.randomBytes(8).toString('hex');

            await User.db.query(`
                INSERT INTO report_templates (
                    id, name, type, parameters, schedule, 
                    recipients, format, created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                templateId,
                name,
                type,
                JSON.stringify(parameters || {}),
                schedule || null,
                JSON.stringify(recipients || []),
                format,
                req.user.id,
                new Date(),
                new Date()
            ]);

            logger.info('Report template saved', {
                templateId,
                name,
                type,
                createdBy: req.user.id
            });

            return res.status(status.CREATED).json(
                successResponse('Report template saved', { template_id: templateId })
            );
        } catch (error) {
            logger.errorWithStack('Save report template error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get report templates
     * @route GET /api/v1/users/reports/templates
     * @access Private (Admin)
     */
    async getReportTemplates(req, res) {
        try {
            const { type, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT rt.*, u.username as created_by_username
                FROM report_templates rt
                LEFT JOIN users u ON rt.created_by = u.id
                WHERE 1=1
            `;
            const params = [];

            if (type) {
                query += ' AND rt.type = ?';
                params.push(type);
            }

            query += ' ORDER BY rt.updated_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [templates] = await User.db.query(query, params);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM report_templates'
            );

            // Parse JSON fields
            const parsedTemplates = templates.map(template => ({
                ...template,
                parameters: template.parameters ? JSON.parse(template.parameters) : {},
                recipients: template.recipients ? JSON.parse(template.recipients) : []
            }));

            return res.status(status.OK).json(
                paginatedResponse('Report templates', parsedTemplates, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get report templates error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Schedule report generation
     * @route POST /api/v1/users/reports/schedule
     * @access Private (Admin)
     */
    async scheduleReport(req, res) {
        try {
            const {
                template_id,
                schedule_type, // daily, weekly, monthly
                schedule_time,
                start_date,
                end_date,
                enabled = true
            } = req.body;

            // Validate template
            const [templates] = await User.db.query(
                'SELECT * FROM report_templates WHERE id = ?',
                [template_id]
            );

            if (templates.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Report template not found')
                );
            }

            const scheduleId = crypto.randomBytes(8).toString('hex');
            const nextRun = this.calculateNextRun(schedule_type, schedule_time);

            await User.db.query(`
                INSERT INTO report_schedules (
                    id, template_id, schedule_type, schedule_time,
                    start_date, end_date, next_run, enabled,
                    created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                scheduleId,
                template_id,
                schedule_type,
                schedule_time,
                start_date || null,
                end_date || null,
                nextRun,
                enabled ? 1 : 0,
                req.user.id,
                new Date(),
                new Date()
            ]);

            logger.info('Report scheduled', {
                scheduleId,
                templateId: template_id,
                scheduleType: schedule_type,
                nextRun,
                createdBy: req.user.id
            });

            return res.status(status.CREATED).json(
                successResponse('Report scheduled successfully', {
                    schedule_id: scheduleId,
                    next_run: nextRun
                })
            );
        } catch (error) {
            logger.errorWithStack('Schedule report error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Calculate next run time
     */
    calculateNextRun(scheduleType, scheduleTime) {
        const now = new Date();
        let nextRun = new Date();

        switch (scheduleType) {
            case 'daily':
                const [hours, minutes] = scheduleTime.split(':').map(Number);
                nextRun.setHours(hours, minutes, 0, 0);
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;
            case 'weekly':
                const [dayOfWeek, time] = scheduleTime.split(' ');
                const [weekHours, weekMinutes] = time.split(':').map(Number);
                nextRun.setHours(weekHours, weekMinutes, 0, 0);
                const targetDay = parseInt(dayOfWeek); // 0 = Sunday, 1 = Monday, etc.
                const currentDay = now.getDay();
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd < 0 || (daysToAdd === 0 && nextRun <= now)) {
                    daysToAdd += 7;
                }
                nextRun.setDate(nextRun.getDate() + daysToAdd);
                break;
            case 'monthly':
                const dayOfMonth = parseInt(scheduleTime);
                nextRun.setDate(dayOfMonth);
                nextRun.setHours(9, 0, 0, 0); // Default to 9 AM
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
                break;
            default:
                nextRun.setDate(now.getDate() + 1);
                nextRun.setHours(9, 0, 0, 0);
        }

        return nextRun;
    }

    /**
     * Process scheduled reports
     */
    async processScheduledReports() {
        try {
            const now = new Date();

            // Get due reports
            const [dueReports] = await User.db.query(`
                SELECT rs.*, rt.*, u.email as creator_email
                FROM report_schedules rs
                JOIN report_templates rt ON rs.template_id = rt.id
                JOIN users u ON rs.created_by = u.id
                WHERE rs.enabled = 1 
                AND rs.next_run <= ?
                AND (rs.end_date IS NULL OR rs.end_date >= ?)
            `, [now, now]);

            for (const report of dueReports) {
                try {
                    // Generate report based on template type
                    const reportData = await this.generateReportByType(
                        JSON.parse(report.parameters),
                        report.type
                    );

                    // Send to recipients
                    const recipients = JSON.parse(report.recipients);
                    await this.sendScheduledReport(reportData, recipients, report.format);

                    // Update next run time
                    const nextRun = this.calculateNextRun(
                        report.schedule_type,
                        report.schedule_time
                    );

                    await User.db.query(
                        'UPDATE report_schedules SET next_run = ?, last_run = ? WHERE id = ?',
                        [nextRun, now, report.id]
                    );

                    // Log the execution
                    await this._createAuditLog(report.created_by, 'SCHEDULED_REPORT_EXECUTED', {
                        schedule_id: report.id,
                        template_id: report.template_id,
                        report_type: report.type,
                        recipients_count: recipients.length,
                        next_run: nextRun
                    });

                    logger.info('Scheduled report processed', {
                        scheduleId: report.id,
                        templateId: report.template_id,
                        nextRun
                    });
                } catch (error) {
                    logger.error('Failed to process scheduled report', {
                        scheduleId: report.id,
                        error: error.message
                    });

                    // Update error count
                    await User.db.query(`
                        UPDATE report_schedules 
                        SET error_count = COALESCE(error_count, 0) + 1,
                            last_error = ?,
                            updated_at = ?
                        WHERE id = ?
                    `, [error.message, now, report.id]);
                }
            }

            return dueReports.length;
        } catch (error) {
            logger.error('Process scheduled reports error', error);
            return 0;
        }
    }

    /**
     * Generate report by type
     */
    async generateReportByType(parameters, type) {
        // This would call the appropriate report generation method
        // Based on the report type
        switch (type) {
            case 'growth':
                return await this.generateGrowthReport({ query: parameters }, {});
            case 'admin_activity':
                return await this.generateAdminActivityReport({ query: parameters }, {});
            case 'retention':
                return await this.generateRetentionReport({ query: parameters }, {});
            default:
                throw new Error(`Unknown report type: ${type}`);
        }
    }

    /**
     * Send scheduled report
     */
    async sendScheduledReport(reportData, recipients, format) {
        try {
            const reportContent = this.formatReportForDelivery(reportData, format);

            for (const recipient of recipients) {
                if (recipient.type === 'email') {
                    await emailService.sendReportEmail({
                        to: recipient.address,
                        subject: `Scheduled Report - ${new Date().toLocaleDateString()}`,
                        report: reportContent,
                        format
                    });
                }
                // Add other delivery methods as needed
            }
        } catch (error) {
            logger.error('Send scheduled report error', error);
            throw error;
        }
    }

    /**
     * Format report for delivery
     */
    formatReportForDelivery(reportData, format) {
        switch (format) {
            case 'csv':
                return this.convertToCSV(reportData.data || []);
            case 'json':
                return JSON.stringify(reportData, null, 2);
            case 'html':
                return this.convertToHTML(reportData);
            default:
                return JSON.stringify(reportData);
        }
    }

    /**
     * Convert data to CSV
     */
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
            headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Convert report to HTML
     */
    convertToHTML(reportData) {
        return `
            <html>
            <body>
                <h1>Report Generated on ${new Date().toLocaleString()}</h1>
                <pre>${JSON.stringify(reportData, null, 2)}</pre>
            </body>
            </html>
        `;
    }

    // ==================== NEW FEATURE 5: IN-APP NOTIFICATION SYSTEM ====================

    /**
     * Create notification
     */
    async createNotification(userId, notificationData) {
        try {
            const {
                type = 'system',
                title,
                message,
                data = null,
                priority = 'normal',
                expires_at = null,
                category = null
            } = notificationData;

            const notificationId = crypto.randomBytes(8).toString('hex');

            await User.db.query(`
                INSERT INTO notifications (
                    id, user_id, type, title, message, data,
                    priority, category, is_read, expires_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            `, [
                notificationId,
                userId,
                type,
                title,
                message,
                data ? JSON.stringify(data) : null,
                priority,
                category,
                expires_at,
                new Date()
            ]);

            // Invalidate notification cache
            await cache.del(`notifications:${userId}:unread_count`);
            await cache.del(`notifications:${userId}:recent`);

            return notificationId;
        } catch (error) {
            logger.error('Create notification error', error);
            throw error;
        }
    }

    /**
     * Get user notifications
     * @route GET /api/v1/users/:id/notifications
     * @access Private (Admin)
     */
    async getUserNotifications(req, res) {
        try {
            const { id } = req.params;
            const {
                page = 1,
                limit = 20,
                unread_only = false,
                type,
                category,
                priority,
                start_date,
                end_date
            } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const offset = (page - 1) * limit;
            let query = `
                SELECT id, type, title, message, data, priority, category,
                       is_read, created_at, read_at, expires_at
                FROM notifications
                WHERE user_id = ?
            `;
            const params = [id];

            if (unread_only === 'true') {
                query += ' AND is_read = 0';
            }

            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            if (category) {
                query += ' AND category = ?';
                params.push(category);
            }

            if (priority) {
                query += ' AND priority = ?';
                params.push(priority);
            }

            if (start_date) {
                query += ' AND created_at >= ?';
                params.push(new Date(start_date));
            }

            if (end_date) {
                query += ' AND created_at <= ?';
                params.push(new Date(end_date));
            }

            query += ' AND (expires_at IS NULL OR expires_at > NOW())';
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [notifications] = await User.db.query(query, params);

            const [countResult] = await User.db.query(
                `SELECT COUNT(*) as total FROM notifications 
                 WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())`,
                [id]
            );

            // Parse JSON data
            const parsedNotifications = notifications.map(notification => ({
                ...notification,
                data: notification.data ? JSON.parse(notification.data) : null
            }));

            // Get unread count
            const [unreadCount] = await User.db.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
                [id]
            );

            return res.status(status.OK).json(
                paginatedResponse('User notifications', parsedNotifications, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit),
                    unread_count: unreadCount[0].count
                })
            );
        } catch (error) {
            logger.errorWithStack('Get user notifications error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Mark notification as read
     * @route POST /api/v1/users/:id/notifications/:notificationId/read
     * @access Private (Admin)
     */
    async markNotificationAsRead(req, res) {
        try {
            const { id, notificationId } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // Verify notification belongs to user
            const [notifications] = await User.db.query(
                'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
                [notificationId, id]
            );

            if (notifications.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Notification not found')
                );
            }

            if (notifications[0].is_read) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Notification is already read')
                );
            }

            await User.db.query(
                'UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?',
                [new Date(), notificationId]
            );

            // Invalidate cache
            await cache.del(`notifications:${id}:unread_count`);
            await cache.del(`notifications:${id}:recent`);

            return res.status(status.OK).json(
                successResponse('Notification marked as read')
            );
        } catch (error) {
            logger.errorWithStack('Mark notification as read error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Mark all notifications as read
     * @route POST /api/v1/users/:id/notifications/read-all
     * @access Private (Admin)
     */
    async markAllNotificationsAsRead(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const [result] = await User.db.query(
                'UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0',
                [new Date(), id]
            );

            // Invalidate cache
            await cache.del(`notifications:${id}:unread_count`);
            await cache.del(`notifications:${id}:recent`);

            return res.status(status.OK).json(
                successResponse('All notifications marked as read', {
                    marked_count: result.affectedRows
                })
            );
        } catch (error) {
            logger.errorWithStack('Mark all notifications as read error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Delete notification
     * @route DELETE /api/v1/users/:id/notifications/:notificationId
     * @access Private (Admin)
     */
    async deleteNotification(req, res) {
        try {
            const { id, notificationId } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // Verify notification belongs to user
            const [notifications] = await User.db.query(
                'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
                [notificationId, id]
            );

            if (notifications.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Notification not found')
                );
            }

            await User.db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);

            // Invalidate cache
            await cache.del(`notifications:${id}:unread_count`);
            await cache.del(`notifications:${id}:recent`);

            return res.status(status.OK).json(
                successResponse('Notification deleted')
            );
        } catch (error) {
            logger.errorWithStack('Delete notification error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Delete expired notifications
     */
    async _pruneOldNotifications() {
        try {
            const [result] = await User.db.query(`
                DELETE FROM notifications 
                WHERE expires_at IS NOT NULL AND expires_at < NOW()
            `);

            if (result.affectedRows > 0) {
                logger.info(`Pruned ${result.affectedRows} expired notifications`);
            }

            return result.affectedRows;
        } catch (error) {
            logger.error('Prune old notifications error', error);
            return 0;
        }
    }

    /**
     * Get notification statistics
     * @route GET /api/v1/users/:id/notifications/stats
     * @access Private (Admin)
     */
    async getNotificationStats(req, res) {
        try {
            const { id } = req.params;
            const { period = '30d' } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const dateFilter = this.getDateFilter(period);

            const [
                totalSent,
                readCount,
                unreadCount,
                byType,
                byCategory,
                byPriority,
                deliveryStats
            ] = await Promise.all([
                // Total sent
                User.db.query(
                    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND created_at >= ?',
                    [id, dateFilter]
                ),
                // Read count
                User.db.query(
                    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 1 AND created_at >= ?',
                    [id, dateFilter]
                ),
                // Unread count
                User.db.query(
                    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
                    [id]
                ),
                // By type
                User.db.query(`
                    SELECT type, COUNT(*) as count,
                           SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count
                    FROM notifications
                    WHERE user_id = ? AND created_at >= ?
                    GROUP BY type
                    ORDER BY count DESC
                `, [id, dateFilter]),
                // By category
                User.db.query(`
                    SELECT category, COUNT(*) as count,
                           SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count
                    FROM notifications
                    WHERE user_id = ? AND created_at >= ? AND category IS NOT NULL
                    GROUP BY category
                    ORDER BY count DESC
                `, [id, dateFilter]),
                // By priority
                User.db.query(`
                    SELECT priority, COUNT(*) as count,
                           SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count
                    FROM notifications
                    WHERE user_id = ? AND created_at >= ?
                    GROUP BY priority
                    ORDER BY 
                        CASE priority
                            WHEN 'high' THEN 1
                            WHEN 'medium' THEN 2
                            WHEN 'low' THEN 3
                            ELSE 4
                        END
                `, [id, dateFilter]),
                // Delivery stats (read time)
                User.db.query(`
                    SELECT 
                        AVG(TIMESTAMPDIFF(MINUTE, created_at, read_at)) as avg_read_time_minutes,
                        MAX(TIMESTAMPDIFF(MINUTE, created_at, read_at)) as max_read_time_minutes,
                        MIN(TIMESTAMPDIFF(MINUTE, created_at, read_at)) as min_read_time_minutes
                    FROM notifications
                    WHERE user_id = ? AND is_read = 1 AND read_at IS NOT NULL
                    AND created_at >= ?
                `, [id, dateFilter])
            ]);

            const total = totalSent[0][0].count;
            const read = readCount[0][0].count;
            const unread = unreadCount[0][0].count;

            const stats = {
                period,
                total_sent: total,
                read_count: read,
                unread_count: unread,
                read_rate: total > 0 ? (read / total * 100).toFixed(2) : 0,
                by_type: byType[0],
                by_category: byCategory[0],
                by_priority: byPriority[0],
                delivery_stats: {
                    avg_read_time_minutes: Math.round(deliveryStats[0][0].avg_read_time_minutes || 0),
                    max_read_time_minutes: deliveryStats[0][0].max_read_time_minutes || 0,
                    min_read_time_minutes: deliveryStats[0][0].min_read_time_minutes || 0
                },
                generated_at: new Date().toISOString()
            };

            return res.status(status.OK).json(
                successResponse('Notification statistics retrieved', stats)
            );
        } catch (error) {
            logger.errorWithStack('Get notification stats error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Send batch notifications
     * @route POST /api/v1/users/notifications/batch
     * @access Private (Admin)
     */
    async sendBatchNotifications(req, res) {
        try {
            const {
                user_ids,
                type = 'system',
                title,
                message,
                data = null,
                priority = 'normal',
                category = null,
                expires_in_hours = 24
            } = req.body;

            if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('User IDs are required')
                );
            }

            if (!title || !message) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Title and message are required')
                );
            }

            if (user_ids.length > 1000) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Maximum 1000 users per batch')
                );
            }

            const expiresAt = expires_in_hours 
                ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
                : null;

            const notifications = user_ids.map(userId => ({
                id: crypto.randomBytes(8).toString('hex'),
                user_id: userId,
                type,
                title,
                message,
                data: data ? JSON.stringify(data) : null,
                priority,
                category,
                is_read: 0,
                expires_at: expiresAt,
                created_at: new Date()
            }));

            // Insert in batches to avoid query size limits
            const batchSize = 100;
            for (let i = 0; i < notifications.length; i += batchSize) {
                const batch = notifications.slice(i, i + batchSize);
                
                const placeholders = batch.map(() => 
                    '(?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
                ).join(',');
                
                const values = batch.flatMap(n => [
                    n.id, n.user_id, n.type, n.title, n.message, n.data,
                    n.priority, n.category, n.expires_at, n.created_at
                ]);

                await User.db.query(`
                    INSERT INTO notifications 
                    (id, user_id, type, title, message, data, priority, category, is_read, expires_at, created_at)
                    VALUES ${placeholders}
                `, values);
            }

            // Invalidate cache for all affected users
            await Promise.all(
                user_ids.map(userId => 
                    cache.del(`notifications:${userId}:unread_count`)
                )
            );

            logger.info('Batch notifications sent', {
                count: notifications.length,
                type,
                priority,
                sentBy: req.user.id
            });

            return res.status(status.CREATED).json(
                successResponse('Batch notifications sent', {
                    notifications_sent: notifications.length,
                    users_count: user_ids.length
                })
            );
        } catch (error) {
            logger.errorWithStack('Send batch notifications error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get notification preferences
     * @route GET /api/v1/users/:id/notifications/preferences
     * @access Private (Admin)
     */
    async getNotificationPreferences(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const [preferences] = await User.db.query(`
                SELECT * FROM user_notification_preferences
                WHERE user_id = ?
            `, [id]);

            const defaultPreferences = {
                email_enabled: true,
                push_enabled: true,
                in_app_enabled: true,
                quiet_hours_start: null,
                quiet_hours_end: null,
                categories: this.notificationCategories.reduce((acc, category) => {
                    acc[category] = true;
                    return acc;
                }, {}),
                priority_levels: {
                    high: true,
                    medium: true,
                    low: true
                }
            };

            const userPreferences = preferences.length > 0 
                ? JSON.parse(preferences[0].preferences)
                : defaultPreferences;

            return res.status(status.OK).json(
                successResponse('Notification preferences retrieved', userPreferences)
            );
        } catch (error) {
            logger.errorWithStack('Get notification preferences error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Update notification preferences
     * @route PUT /api/v1/users/:id/notifications/preferences
     * @access Private (Admin)
     */
    async updateNotificationPreferences(req, res) {
        try {
            const { id } = req.params;
            const preferences = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            await User.db.query(`
                INSERT INTO user_notification_preferences (user_id, preferences, updated_at)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE preferences = ?, updated_at = ?
            `, [
                id,
                JSON.stringify(preferences),
                new Date(),
                JSON.stringify(preferences),
                new Date()
            ]);

            logger.info('Notification preferences updated', {
                userId: id,
                updatedBy: req.user.id
            });

            return res.status(status.OK).json(
                successResponse('Notification preferences updated')
            );
        } catch (error) {
            logger.errorWithStack('Update notification preferences error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ==================== NEW FEATURE 6: ADVANCED BULK OPERATIONS ====================

    /**
     * Validate bulk data
     */
    async _validateBulkData(rows, operation) {
        const errors = [];
        const validRows = [];
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowErrors = [];
            const rowNumber = i + 1;

            try {
                // Basic validation
                if (!row.email && !row.username) {
                    rowErrors.push('Email or username is required');
                }

                if (row.email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(row.email)) {
                        rowErrors.push('Invalid email format');
                    }
                }

                if (row.username) {
                    if (row.username.length < 3 || row.username.length > 30) {
                        rowErrors.push('Username must be between 3 and 30 characters');
                    }
                    if (!/^[a-zA-Z0-9_]+$/.test(row.username)) {
                        rowErrors.push('Username can only contain letters, numbers, and underscores');
                    }
                }

                if (row.password) {
                    if (row.password.length < 8) {
                        rowErrors.push('Password must be at least 8 characters');
                    }
                }

                if (row.role) {
                    const validRoles = ['admin', 'manager', 'user', 'guest'];
                    if (!validRoles.includes(row.role.toLowerCase())) {
                        rowErrors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
                    }
                }

                // Operation-specific validation
                switch (operation) {
                    case 'import':
                        if (!row.password) {
                            rowErrors.push('Password is required for import');
                        }
                        break;
                    case 'update':
                        if (!row.id && !row.email && !row.username) {
                            rowErrors.push('ID, email, or username is required for update');
                        }
                        break;
                    case 'delete':
                        if (!row.id && !row.email && !row.username) {
                            rowErrors.push('ID, email, or username is required for deletion');
                        }
                        break;
                }

                if (rowErrors.length === 0) {
                    validRows.push({
                        rowNumber,
                        data: row,
                        originalIndex: i
                    });
                } else {
                    errors.push({
                        rowNumber,
                        errors: rowErrors,
                        data: row
                    });
                }
            } catch (error) {
                errors.push({
                    rowNumber,
                    errors: [`Validation error: ${error.message}`],
                    data: row
                });
            }
        }

        return { validRows, errors };
    }

    /**
     * Bulk import users
     * @route POST /api/v1/users/bulk/import
     * @access Private (Admin)
     */
    async bulkImportUsers(req, res) {
        const startTime = Date.now();
        try {
            const { users, send_welcome_email = false, require_verification = false } = req.body;

            if (!users || !Array.isArray(users)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Users array is required')
                );
            }

            if (users.length > 1000) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Maximum 1000 users per import')
                );
            }

            // Validate all rows
            const validation = await this._validateBulkData(users, 'import');
            
            if (validation.errors.length > 0 && validation.validRows.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('All rows failed validation', {
                        errors: validation.errors,
                        total_rows: users.length
                    })
                );
            }

            const result = {
                total: users.length,
                success: 0,
                failed: 0,
                errors: [],
                imported_users: []
            };

            // Process valid rows
            for (const row of validation.validRows) {
                try {
                    const userData = row.data;
                    
                    // Check for duplicates
                    const [existingEmail, existingUsername] = await Promise.all([
                        userData.email ? User.findByEmail(userData.email) : Promise.resolve(null),
                        userData.username ? User.findByUsername(userData.username) : Promise.resolve(null)
                    ]);

                    if (existingEmail || existingUsername) {
                        result.failed++;
                        result.errors.push({
                            rowNumber: row.rowNumber,
                            error: existingEmail ? 'Email already exists' : 'Username already exists',
                            data: userData
                        });
                        continue;
                    }

                    // Hash password
                    const hashedPassword = await bcrypt.hash(
                        userData.password,
                        config.SECURITY.BCRYPT.SALT_ROUNDS
                    );

                    // Generate verification token if needed
                    let verificationToken = null;
                    let verificationTokenExpiry = null;
                    
                    if (require_verification) {
                        verificationToken = crypto.randomBytes(32).toString('hex');
                        verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    }

                    // Create user
                    const userId = await User.create({
                        username: userData.username,
                        email: userData.email,
                        password: hashedPassword,
                        first_name: userData.first_name || null,
                        last_name: userData.last_name || null,
                        phone: userData.phone || null,
                        role: (userData.role || 'user').toLowerCase(),
                        is_active: 1,
                        is_verified: require_verification ? 0 : 1,
                        verification_token: verificationToken,
                        verification_token_expires: verificationTokenExpiry,
                        created_at: new Date(),
                        created_by: req.user.id,
                        meta: userData.meta ? JSON.stringify(userData.meta) : null
                    });

                    // Send welcome email if requested
                    if (send_welcome_email && userData.email) {
                        try {
                            await emailService.sendWelcomeEmail({
                                to: userData.email,
                                username: userData.username || userData.email.split('@')[0],
                                name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
                                verificationToken: require_verification ? verificationToken : null
                            });
                        } catch (emailError) {
                            logger.warn('Failed to send welcome email during bulk import', {
                                userId,
                                error: emailError.message
                            });
                        }
                    }

                    result.success++;
                    result.imported_users.push({
                        id: userId,
                        email: userData.email,
                        username: userData.username,
                        row_number: row.rowNumber
                    });

                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        rowNumber: row.rowNumber,
                        error: error.message,
                        data: row.data
                    });
                }
            }

            // Log the bulk import
            logger.security('BULK_USER_IMPORT', {
                total: result.total,
                success: result.success,
                failed: result.failed,
                importedBy: req.user.id,
                duration: Date.now() - startTime
            });

            return res.status(status.OK).json(
                successResponse('Bulk import completed', result)
            );

        } catch (error) {
            logger.errorWithStack('Bulk import users error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Bulk export users with complex filters
     * @route POST /api/v1/users/bulk/export
     * @access Private (Admin)
     */
    async bulkExportUsers(req, res) {
        try {
            const {
                filters = {},
                fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'created_at'],
                format = 'json',
                include_inactive = false,
                start_date,
                end_date
            } = req.body;

            // Build query based on filters
            let query = 'SELECT * FROM users WHERE 1=1';
            const params = [];

            // Role filter
            if (filters.role) {
                if (Array.isArray(filters.role)) {
                    query += ` AND role IN (${filters.role.map(() => '?').join(',')})`;
                    params.push(...filters.role.map(r => r.toLowerCase()));
                } else {
                    query += ' AND role = ?';
                    params.push(filters.role.toLowerCase());
                }
            }

            // Status filter
            if (filters.status) {
                if (filters.status === 'active') {
                    query += ' AND is_active = 1 AND is_suspended = 0';
                } else if (filters.status === 'inactive') {
                    query += ' AND is_active = 0';
                } else if (filters.status === 'suspended') {
                    query += ' AND is_suspended = 1';
                } else if (filters.status === 'verified') {
                    query += ' AND is_verified = 1';
                } else if (filters.status === 'unverified') {
                    query += ' AND is_verified = 0';
                }
            }

            if (!include_inactive) {
                query += ' AND is_active = 1';
            }

            // Date range filter
            if (start_date) {
                query += ' AND created_at >= ?';
                params.push(new Date(start_date));
            }
            if (end_date) {
                query += ' AND created_at <= ?';
                params.push(new Date(end_date));
            }

            // Custom field filters
            if (filters.custom_fields) {
                Object.entries(filters.custom_fields).forEach(([field, value]) => {
                    if (value !== undefined && value !== null) {
                        query += ` AND JSON_EXTRACT(meta, '$."${field}"') = ?`;
                        params.push(value);
                    }
                });
            }

            // Search filter
            if (filters.search) {
                query += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
                const searchPattern = `%${filters.search}%`;
                params.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }

            query += ' ORDER BY created_at DESC';

            const [users] = await User.db.query(query, params);

            // Filter fields
            const filteredUsers = users.map(user => {
                const filtered = {};
                fields.forEach(field => {
                    if (user[field] !== undefined) {
                        filtered[field] = user[field];
                    }
                });
                
                // Include custom fields from meta
                if (fields.includes('meta') && user.meta) {
                    filtered.meta = JSON.parse(user.meta);
                }
                
                return filtered;
            });

            // Export based on format
            if (format === 'csv') {
                return this.exportToCSV(res, filteredUsers);
            } else if (format === 'json') {
                return res.status(status.OK).json(
                    successResponse('Users exported', {
                        count: filteredUsers.length,
                        data: filteredUsers,
                        exported_at: new Date().toISOString(),
                        filters_applied: filters
                    })
                );
            } else if (format === 'excel') {
                return this.exportToExcel(res, filteredUsers);
            }

            return res.status(status.OK).json(
                successResponse('Users exported', {
                    count: filteredUsers.length,
                    data: filteredUsers
                })
            );
        } catch (error) {
            logger.errorWithStack('Bulk export users error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Bulk update users
     * @route PUT /api/v1/users/bulk/update
     * @access Private (Admin)
     */
    async bulkUpdateUsers(req, res) {
        const startTime = Date.now();
        try {
            const { updates, fail_fast = false } = req.body;

            if (!updates || !Array.isArray(updates)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Updates array is required')
                );
            }

            if (updates.length > 500) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Maximum 500 updates per batch')
                );
            }

            // Validate updates
            const validation = await this._validateBulkData(updates, 'update');
            
            if (validation.errors.length > 0 && validation.validRows.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('All updates failed validation', {
                        errors: validation.errors
                    })
                );
            }

            const result = {
                total: updates.length,
                success: 0,
                failed: 0,
                errors: [],
                updated_users: []
            };

            // Start transaction for partial rollback
            const connection = await User.db.getConnection();
            await connection.beginTransaction();

            try {
                for (const row of validation.validRows) {
                    try {
                        const updateData = row.data;
                        
                        // Find user by ID, email, or username
                        let user;
                        if (updateData.id) {
                            user = await User.findById(updateData.id);
                        } else if (updateData.email) {
                            user = await User.findByEmail(updateData.email);
                        } else if (updateData.username) {
                            user = await User.findByUsername(updateData.username);
                        }

                        if (!user) {
                            throw new Error('User not found');
                        }

                        // Check permissions
                        if (!await this.canManageRole(req.user.role, user.role)) {
                            throw new Error(`Cannot update user with role: ${user.role}`);
                        }

                        // Prepare update data
                        const updatePayload = this.buildUpdateData(updateData);
                        if (Object.keys(updatePayload).length === 0) {
                            throw new Error('No valid fields to update');
                        }

                        updatePayload.updated_at = new Date();
                        updatePayload.updated_by = req.user.id;

                        // Perform update
                        await User.update(user.id, updatePayload);

                        // Invalidate cache
                        await cache.del(`${this.cachePrefix}${user.id}*`);

                        result.success++;
                        result.updated_users.push({
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            updated_fields: Object.keys(updatePayload).filter(k => !['updated_at', 'updated_by'].includes(k))
                        });

                    } catch (error) {
                        result.failed++;
                        result.errors.push({
                            rowNumber: row.rowNumber,
                            error: error.message,
                            data: row.data
                        });

                        if (fail_fast) {
                            throw new Error(`Failed at row ${row.rowNumber}: ${error.message}`);
                        }
                    }
                }

                // Commit transaction if no fail_fast errors
                await connection.commit();

                logger.security('BULK_USER_UPDATE', {
                    total: result.total,
                    success: result.success,
                    failed: result.failed,
                    updatedBy: req.user.id,
                    duration: Date.now() - startTime
                });

                return res.status(status.OK).json(
                    successResponse('Bulk update completed', result)
                );

            } catch (error) {
                // Rollback transaction on error
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.errorWithStack('Bulk update users error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Bulk delete users
     * @route POST /api/v1/users/bulk/delete
     * @access Private (Admin)
     */
    async bulkDeleteUsers(req, res) {
        try {
            const { 
                user_ids = [],
                filters = {},
                delete_type = 'soft', // soft or hard
                reason,
                confirm = false
            } = req.body;

            if (!confirm) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Please confirm bulk deletion by setting confirm=true')
                );
            }

            // Get users to delete based on IDs or filters
            let usersToDelete = [];

            if (user_ids.length > 0) {
                const [users] = await User.db.query(
                    `SELECT id, username, email, role FROM users WHERE id IN (${user_ids.map(() => '?').join(',')})`,
                    user_ids
                );
                usersToDelete = users;
            } else if (Object.keys(filters).length > 0) {
                // Build query from filters
                let query = 'SELECT id, username, email, role FROM users WHERE 1=1';
                const params = [];

                if (filters.role) {
                    query += ' AND role = ?';
                    params.push(filters.role);
                }
                if (filters.status === 'inactive') {
                    query += ' AND is_active = 0';
                }
                if (filters.created_before) {
                    query += ' AND created_at < ?';
                    params.push(new Date(filters.created_before));
                }

                const [users] = await User.db.query(query, params);
                usersToDelete = users;
            } else {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Either user_ids or filters must be provided')
                );
            }

            if (usersToDelete.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('No users found matching criteria')
                );
            }

            if (usersToDelete.length > 100) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Maximum 100 users per bulk deletion')
                );
            }

            // Check permissions and prevent self-deletion
            const currentUserId = req.user.id;
            const filteredUsers = usersToDelete.filter(user => {
                // Don't delete self
                if (user.id === currentUserId) {
                    return false;
                }
                // Check role permissions
                return this.canManageRole(req.user.role, user.role);
            });

            const result = {
                total: usersToDelete.length,
                filtered: filteredUsers.length,
                success: 0,
                failed: 0,
                errors: [],
                deleted_users: []
            };

            // Perform deletion
            for (const user of filteredUsers) {
                try {
                    if (delete_type === 'hard') {
                        // Hard delete
                        await User.delete(user.id);
                        await this.deleteUserRelatedData(user.id);
                    } else {
                        // Soft delete
                        await User.update(user.id, {
                            is_active: 0,
                            is_deleted: 1,
                            deleted_at: new Date(),
                            deleted_by: req.user.id,
                            deletion_reason: reason,
                            updated_at: new Date()
                        });
                        await this.invalidateUserSessions(user.id);
                    }

                    // Invalidate cache
                    await cache.del(`${this.cachePrefix}${user.id}*`);

                    result.success++;
                    result.deleted_users.push({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        type: delete_type
                    });

                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        id: user.id,
                        error: error.message
                    });
                }
            }

            logger.security('BULK_USER_DELETION', {
                total: result.total,
                success: result.success,
                failed: result.failed,
                deleteType: delete_type,
                deletedBy: req.user.id,
                reason
            });

            return res.status(status.OK).json(
                successResponse('Bulk deletion completed', result)
            );

        } catch (error) {
            logger.errorWithStack('Bulk delete users error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Bulk restore users
     * @route POST /api/v1/users/bulk/restore
     * @access Private (Admin)
     */
    async bulkRestoreUsers(req, res) {
        try {
            const { user_ids, confirm = false } = req.body;

            if (!confirm) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Please confirm bulk restoration by setting confirm=true')
                );
            }

            if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('User IDs array is required')
                );
            }

            if (user_ids.length > 100) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Maximum 100 users per bulk restoration')
                );
            }

            const [deletedUsers] = await User.db.query(
                `SELECT id, username, email, role FROM users 
                 WHERE id IN (${user_ids.map(() => '?').join(',')}) 
                 AND is_deleted = 1`,
                user_ids
            );

            const result = {
                total: user_ids.length,
                found: deletedUsers.length,
                success: 0,
                failed: 0,
                errors: [],
                restored_users: []
            };

            for (const user of deletedUsers) {
                try {
                    // Check permissions
                    if (!await this.canManageRole(req.user.role, user.role)) {
                        throw new Error(`Cannot restore user with role: ${user.role}`);
                    }

                    await User.update(user.id, {
                        is_active: 1,
                        is_deleted: 0,
                        deleted_at: null,
                        deleted_by: null,
                        deletion_reason: null,
                        restored_at: new Date(),
                        restored_by: req.user.id,
                        updated_at: new Date()
                    });

                    // Invalidate cache
                    await cache.del(`${this.cachePrefix}${user.id}*`);

                    result.success++;
                    result.restored_users.push({
                        id: user.id,
                        username: user.username,
                        email: user.email
                    });

                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        id: user.id,
                        error: error.message
                    });
                }
            }

            logger.security('BULK_USER_RESTORATION', {
                total: result.total,
                success: result.success,
                failed: result.failed,
                restoredBy: req.user.id
            });

            return res.status(status.OK).json(
                successResponse('Bulk restoration completed', result)
            );

        } catch (error) {
            logger.errorWithStack('Bulk restore users error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Track progress of long-running bulk operation
     * @route GET /api/v1/users/bulk/operations/:operationId
     * @access Private (Admin)
     */
    async getBulkOperationStatus(req, res) {
        try {
            const { operationId } = req.params;

            const [operations] = await User.db.query(`
                SELECT * FROM bulk_operations
                WHERE id = ?
            `, [operationId]);

            if (operations.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Operation not found')
                );
            }

            const operation = operations[0];
            const progress = JSON.parse(operation.progress_data || '{}');

            const status = {
                id: operation.id,
                type: operation.operation_type,
                status: operation.status,
                progress: operation.progress_percentage,
                total_items: operation.total_items,
                processed_items: operation.processed_items,
                success_count: operation.success_count,
                failure_count: operation.failure_count,
                created_at: operation.created_at,
                started_at: operation.started_at,
                completed_at: operation.completed_at,
                errors: progress.errors || [],
                details: progress.details || {}
            };

            return res.status(status.OK).json(
                successResponse('Operation status retrieved', status)
            );
        } catch (error) {
            logger.errorWithStack('Get bulk operation status error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Create bulk operation record
     */
    async createBulkOperation(operationType, totalItems, createdBy) {
        try {
            const operationId = crypto.randomBytes(8).toString('hex');

            await User.db.query(`
                INSERT INTO bulk_operations (
                    id, operation_type, total_items, status,
                    created_by, created_at, updated_at
                ) VALUES (?, ?, ?, 'pending', ?, ?, ?)
            `, [
                operationId,
                operationType,
                totalItems,
                createdBy,
                new Date(),
                new Date()
            ]);

            return operationId;
        } catch (error) {
            logger.error('Create bulk operation error', error);
            throw error;
        }
    }

    /**
     * Update bulk operation progress
     */
    async updateBulkOperationProgress(operationId, progressData) {
        try {
            const {
                processedItems,
                successCount,
                failureCount,
                errors = [],
                details = {}
            } = progressData;

            const [operation] = await User.db.query(
                'SELECT total_items FROM bulk_operations WHERE id = ?',
                [operationId]
            );

            if (operation.length === 0) return;

            const totalItems = operation[0].total_items;
            const progressPercentage = totalItems > 0 
                ? Math.round((processedItems / totalItems) * 100)
                : 0;

            let status = 'processing';
            if (processedItems >= totalItems) {
                status = failureCount > 0 ? 'completed_with_errors' : 'completed';
            }

            await User.db.query(`
                UPDATE bulk_operations SET
                    processed_items = ?,
                    success_count = ?,
                    failure_count = ?,
                    progress_percentage = ?,
                    status = ?,
                    progress_data = ?,
                    updated_at = ?,
                    ${processedItems >= totalItems ? 'completed_at = ?,' : ''}
                    ${processedItems === 0 ? 'started_at = ?,' : ''}
                    id = id
                WHERE id = ?
            `, [
                processedItems,
                successCount,
                failureCount,
                progressPercentage,
                status,
                JSON.stringify({ errors, details }),
                new Date(),
                ...(processedItems >= totalItems ? [new Date()] : []),
                ...(processedItems === 0 ? [new Date()] : []),
                operationId
            ].filter(Boolean));
        } catch (error) {
            logger.error('Update bulk operation progress error', error);
        }
    }

    // ==================== NEW FEATURE 7: WEBHOOK SYSTEM ====================

    /**
     * Send webhook with retry
     */
    async _sendWebhookWithRetry(webhook, payload, currentAttempt = 1) {
        try {
            const maxRetries = 3;
            const baseDelay = 1000; // 1 second base delay

            if (currentAttempt > maxRetries) {
                throw new Error(`Max retries (${maxRetries}) exceeded`);
            }

            // Calculate exponential backoff delay
            const delay = baseDelay * Math.pow(2, currentAttempt - 1);
            
            // Add jitter (±20%)
            const jitter = delay * 0.2 * (Math.random() * 2 - 1);
            const totalDelay = Math.max(delay + jitter, 100);

            if (currentAttempt > 1) {
                await new Promise(resolve => setTimeout(resolve, totalDelay));
            }

            // Create signature
            const timestamp = Date.now();
            const signature = this.createWebhookSignature(webhook, payload, timestamp);

            // Send webhook
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Timestamp': timestamp.toString(),
                    'X-Webhook-Event': payload.event,
                    'X-Webhook-ID': webhook.id
                },
                body: JSON.stringify(payload),
                timeout: 10000 // 10 second timeout
            });

            // Log the attempt
            await this.logWebhookAttempt(
                webhook.id,
                payload.event,
                response.status,
                currentAttempt,
                null
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return {
                success: true,
                attempt: currentAttempt,
                status: response.status
            };

        } catch (error) {
            // Log failed attempt
            await this.logWebhookAttempt(
                webhook.id,
                payload.event,
                null,
                currentAttempt,
                error.message
            );

            // Retry if not exceeded max retries
            if (currentAttempt < maxRetries) {
                return await this._sendWebhookWithRetry(webhook, payload, currentAttempt + 1);
            }

            // Move to dead letter queue if max retries exceeded
            await this.moveToDeadLetterQueue(webhook, payload, error);

            return {
                success: false,
                attempt: currentAttempt,
                error: error.message
            };
        }
    }

    /**
     * Create webhook signature
     */
    createWebhookSignature(webhook, payload, timestamp) {
        const secret = webhook.secret;
        const data = `${timestamp}.${JSON.stringify(payload)}`;
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }

    /**
     * Log webhook attempt
     */
    async logWebhookAttempt(webhookId, event, status, attempt, error) {
        try {
            await User.db.query(`
                INSERT INTO webhook_logs (
                    webhook_id, event, status, attempt, error, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                webhookId,
                event,
                status,
                attempt,
                error,
                new Date()
            ]);
        } catch (error) {
            logger.error('Log webhook attempt error', error);
        }
    }

    /**
     * Move to dead letter queue
     */
    async moveToDeadLetterQueue(webhook, payload, error) {
        try {
            await User.db.query(`
                INSERT INTO webhook_dead_letter_queue (
                    webhook_id, event, payload, error, created_at
                ) VALUES (?, ?, ?, ?, ?)
            `, [
                webhook.id,
                payload.event,
                JSON.stringify(payload),
                error.message,
                new Date()
            ]);
        } catch (error) {
            logger.error('Move to dead letter queue error', error);
        }
    }

    /**
     * Register webhook
     * @route POST /api/v1/users/webhooks
     * @access Private (Admin)
     */
    async registerWebhook(req, res) {
        try {
            const {
                url,
                events,
                secret,
                name,
                description,
                enabled = true,
                timeout_seconds = 10,
                retry_count = 3
            } = req.body;

            if (!url || !events || !Array.isArray(events) || events.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('URL and events array are required')
                );
            }

            // Validate URL
            try {
                new URL(url);
            } catch (error) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Invalid URL')
                );
            }

            // Validate events
            const invalidEvents = events.filter(event => !this.webhookEvents.includes(event));
            if (invalidEvents.length > 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(`Invalid events: ${invalidEvents.join(', ')}`)
                );
            }

            // Generate secret if not provided
            const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

            const webhookId = crypto.randomBytes(8).toString('hex');

            await User.db.query(`
                INSERT INTO webhooks (
                    id, name, description, url, secret, events,
                    enabled, timeout_seconds, retry_count,
                    created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                webhookId,
                name || `Webhook ${new Date().toLocaleDateString()}`,
                description || null,
                url,
                webhookSecret,
                JSON.stringify(events),
                enabled ? 1 : 0,
                timeout_seconds,
                retry_count,
                req.user.id,
                new Date(),
                new Date()
            ]);

            // Perform health check
            const healthStatus = await this.checkWebhookHealth(webhookId);

            logger.security('WEBHOOK_REGISTERED', {
                webhookId,
                url,
                events: events.length,
                createdBy: req.user.id
            });

            return res.status(status.CREATED).json(
                successResponse('Webhook registered', {
                    webhook_id: webhookId,
                    secret: webhookSecret,
                    health_status: healthStatus
                })
            );
        } catch (error) {
            logger.errorWithStack('Register webhook error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Check webhook health
     */
    async checkWebhookHealth(webhookId) {
        try {
            const [webhooks] = await User.db.query(
                'SELECT url, secret FROM webhooks WHERE id = ? AND enabled = 1',
                [webhookId]
            );

            if (webhooks.length === 0) {
                return { status: 'not_found', message: 'Webhook not found or disabled' };
            }

            const webhook = webhooks[0];
            
            // Send test payload
            const testPayload = {
                event: 'health_check',
                timestamp: new Date().toISOString(),
                data: { test: true }
            };

            const timestamp = Date.now();
            const signature = this.createWebhookSignature(webhook, testPayload, timestamp);

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Timestamp': timestamp.toString(),
                    'X-Webhook-Event': 'health_check'
                },
                body: JSON.stringify(testPayload),
                timeout: 5000 // 5 second timeout for health check
            });

            const status = response.status;
            const isHealthy = status >= 200 && status < 300;

            // Update health status
            await User.db.query(
                'UPDATE webhooks SET last_health_check = ?, health_status = ? WHERE id = ?',
                [new Date(), isHealthy ? 'healthy' : 'unhealthy', webhookId]
            );

            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                http_status: status,
                checked_at: new Date().toISOString()
            };

        } catch (error) {
            // Update health status as failed
            await User.db.query(
                'UPDATE webhooks SET last_health_check = ?, health_status = ? WHERE id = ?',
                [new Date(), 'failed', webhookId]
            );

            return {
                status: 'failed',
                error: error.message,
                checked_at: new Date().toISOString()
            };
        }
    }

    /**
     * Get webhooks
     * @route GET /api/v1/users/webhooks
     * @access Private (Admin)
     */
    async getWebhooks(req, res) {
        try {
            const { enabled, event, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT id, name, description, url, events, enabled,
                       timeout_seconds, retry_count, health_status,
                       last_health_check, created_by, created_at, updated_at
                FROM webhooks
                WHERE 1=1
            `;
            const params = [];

            if (enabled !== undefined) {
                query += ' AND enabled = ?';
                params.push(enabled === 'true' ? 1 : 0);
            }

            if (event) {
                query += ' AND JSON_CONTAINS(events, ?)';
                params.push(JSON.stringify(event));
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [webhooks] = await User.db.query(query, params);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM webhooks'
            );

            // Parse JSON fields and hide secrets
            const parsedWebhooks = webhooks.map(webhook => ({
                ...webhook,
                events: JSON.parse(webhook.events),
                secret: '***' // Hide secret in response
            }));

            return res.status(status.OK).json(
                paginatedResponse('Webhooks', parsedWebhooks, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get webhooks error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Update webhook
     * @route PUT /api/v1/users/webhooks/:webhookId
     * @access Private (Admin)
     */
    async updateWebhook(req, res) {
        try {
            const { webhookId } = req.params;
            const updates = req.body;

            // Check if webhook exists
            const [webhooks] = await User.db.query(
                'SELECT * FROM webhooks WHERE id = ?',
                [webhookId]
            );

            if (webhooks.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Webhook not found')
                );
            }

            // Build update query
            const updateFields = [];
            const params = [];

            if (updates.name !== undefined) {
                updateFields.push('name = ?');
                params.push(updates.name);
            }

            if (updates.description !== undefined) {
                updateFields.push('description = ?');
                params.push(updates.description);
            }

            if (updates.url !== undefined) {
                // Validate URL
                try {
                    new URL(updates.url);
                } catch (error) {
                    return res.status(status.BAD_REQUEST).json(
                        errorResponse('Invalid URL')
                    );
                }
                updateFields.push('url = ?');
                params.push(updates.url);
            }

            if (updates.events !== undefined) {
                if (!Array.isArray(updates.events) || updates.events.length === 0) {
                    return res.status(status.BAD_REQUEST).json(
                        errorResponse('Events must be a non-empty array')
                    );
                }
                updateFields.push('events = ?');
                params.push(JSON.stringify(updates.events));
            }

            if (updates.enabled !== undefined) {
                updateFields.push('enabled = ?');
                params.push(updates.enabled ? 1 : 0);
            }

            if (updates.timeout_seconds !== undefined) {
                updateFields.push('timeout_seconds = ?');
                params.push(updates.timeout_seconds);
            }

            if (updates.retry_count !== undefined) {
                updateFields.push('retry_count = ?');
                params.push(updates.retry_count);
            }

            if (updateFields.length === 0) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('No fields to update')
                );
            }

            updateFields.push('updated_at = ?');
            params.push(new Date());

            params.push(webhookId);

            await User.db.query(
                `UPDATE webhooks SET ${updateFields.join(', ')} WHERE id = ?`,
                params
            );

            // Perform health check if URL changed
            if (updates.url) {
                await this.checkWebhookHealth(webhookId);
            }

            logger.security('WEBHOOK_UPDATED', {
                webhookId,
                updatedBy: req.user.id,
                fields: updateFields.filter(f => !f.includes('updated_at'))
            });

            return res.status(status.OK).json(
                successResponse('Webhook updated')
            );
        } catch (error) {
            logger.errorWithStack('Update webhook error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Delete webhook
     * @route DELETE /api/v1/users/webhooks/:webhookId
     * @access Private (Admin)
     */
    async deleteWebhook(req, res) {
        try {
            const { webhookId } = req.params;

            // Check if webhook exists
            const [webhooks] = await User.db.query(
                'SELECT * FROM webhooks WHERE id = ?',
                [webhookId]
            );

            if (webhooks.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Webhook not found')
                );
            }

            await User.db.query('DELETE FROM webhooks WHERE id = ?', [webhookId]);

            // Also clean up related logs (optional, can be kept for audit)
            await User.db.query('DELETE FROM webhook_logs WHERE webhook_id = ?', [webhookId]);

            logger.security('WEBHOOK_DELETED', {
                webhookId,
                deletedBy: req.user.id
            });

            return res.status(status.OK).json(
                successResponse('Webhook deleted')
            );
        } catch (error) {
            logger.errorWithStack('Delete webhook error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get webhook logs
     * @route GET /api/v1/users/webhooks/:webhookId/logs
     * @access Private (Admin)
     */
    async getWebhookLogs(req, res) {
        try {
            const { webhookId } = req.params;
            const {
                page = 1,
                limit = 20,
                status,
                event,
                start_date,
                end_date
            } = req.query;

            // Check if webhook exists
            const [webhooks] = await User.db.query(
                'SELECT id FROM webhooks WHERE id = ?',
                [webhookId]
            );

            if (webhooks.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Webhook not found')
                );
            }

            const offset = (page - 1) * limit;
            let query = `
                SELECT id, event, status, attempt, error, created_at
                FROM webhook_logs
                WHERE webhook_id = ?
            `;
            const params = [webhookId];

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            if (event) {
                query += ' AND event = ?';
                params.push(event);
            }

            if (start_date) {
                query += ' AND created_at >= ?';
                params.push(new Date(start_date));
            }

            if (end_date) {
                query += ' AND created_at <= ?';
                params.push(new Date(end_date));
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [logs] = await User.db.query(query, params);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM webhook_logs WHERE webhook_id = ?',
                [webhookId]
            );

            // Calculate statistics
            const [stats] = await User.db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status >= 200 AND status < 300 THEN 1 ELSE 0 END) as success,
                    SUM(CASE WHEN status IS NULL OR status >= 400 THEN 1 ELSE 0 END) as failed,
                    AVG(CASE WHEN status >= 200 AND status < 300 THEN attempt ELSE NULL END) as avg_attempts_success
                FROM webhook_logs
                WHERE webhook_id = ?
            `, [webhookId]);

            return res.status(status.OK).json(
                paginatedResponse('Webhook logs', logs, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit),
                    statistics: stats[0]
                })
            );
        } catch (error) {
            logger.errorWithStack('Get webhook logs error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Trigger webhook for event
     */
    async triggerWebhook(event, payload) {
        try {
            // Get webhooks subscribed to this event
            const [webhooks] = await User.db.query(`
                SELECT * FROM webhooks 
                WHERE enabled = 1 
                AND JSON_CONTAINS(events, ?)
            `, [JSON.stringify(event)]);

            const results = await Promise.allSettled(
                webhooks.map(webhook => 
                    this._sendWebhookWithRetry(webhook, {
                        event,
                        timestamp: new Date().toISOString(),
                        ...payload
                    })
                )
            );

            const summary = {
                total: webhooks.length,
                success: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
                failed: results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
            };

            logger.info('Webhook triggered', {
                event,
                webhooks_count: webhooks.length,
                success_count: summary.success,
                failed_count: summary.failed
            });

            return summary;
        } catch (error) {
            logger.error('Trigger webhook error', error);
            return { total: 0, success: 0, failed: 0 };
        }
    }

    /**
     * Get dead letter queue items
     * @route GET /api/v1/users/webhooks/dead-letter
     * @access Private (Admin)
     */
    async getDeadLetterQueue(req, res) {
        try {
            const { page = 1, limit = 20, webhook_id, event } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT dlq.*, w.name as webhook_name, w.url
                FROM webhook_dead_letter_queue dlq
                LEFT JOIN webhooks w ON dlq.webhook_id = w.id
                WHERE 1=1
            `;
            const params = [];

            if (webhook_id) {
                query += ' AND dlq.webhook_id = ?';
                params.push(webhook_id);
            }

            if (event) {
                query += ' AND dlq.event = ?';
                params.push(event);
            }

            query += ' ORDER BY dlq.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [items] = await User.db.query(query, params);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM webhook_dead_letter_queue'
            );

            // Parse JSON payload
            const parsedItems = items.map(item => ({
                ...item,
                payload: item.payload ? JSON.parse(item.payload) : null
            }));

            return res.status(status.OK).json(
                paginatedResponse('Dead letter queue', parsedItems, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get dead letter queue error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Retry dead letter queue item
     * @route POST /api/v1/users/webhooks/dead-letter/:itemId/retry
     * @access Private (Admin)
     */
    async retryDeadLetterItem(req, res) {
        try {
            const { itemId } = req.params;

            // Get dead letter item
            const [items] = await User.db.query(`
                SELECT dlq.*, w.*
                FROM webhook_dead_letter_queue dlq
                JOIN webhooks w ON dlq.webhook_id = w.id
                WHERE dlq.id = ?
            `, [itemId]);

            if (items.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Dead letter item not found')
                );
            }

            const item = items[0];
            const payload = JSON.parse(item.payload);

            // Retry webhook
            const result = await this._sendWebhookWithRetry(item, payload);

            if (result.success) {
                // Remove from dead letter queue
                await User.db.query('DELETE FROM webhook_dead_letter_queue WHERE id = ?', [itemId]);
            }

            return res.status(status.OK).json(
                successResponse('Retry attempted', {
                    success: result.success,
                    attempt: result.attempt,
                    error: result.error
                })
            );
        } catch (error) {
            logger.errorWithStack('Retry dead letter item error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    // ==================== NEW FEATURE 8: ADVANCED VALIDATION ENGINE ====================

    /**
     * Create validation rule
     * @route POST /api/v1/users/validation/rules
     * @access Private (Admin)
     */
    async createValidationRule(req, res) {
        try {
            const {
                name,
                description,
                field,
                rule_type,
                parameters,
                error_message,
                error_message_fa,
                enabled = true,
                apply_to_roles = [],
                priority = 0,
                conditions = null
            } = req.body;

            if (!name || !field || !rule_type) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Name, field, and rule_type are required')
                );
            }

            // Validate rule type
            const validRuleTypes = [
                'required', 'email', 'phone', 'min_length', 'max_length',
                'regex', 'unique', 'custom', 'date_format', 'numeric',
                'boolean', 'array', 'object', 'in', 'not_in'
            ];

            if (!validRuleTypes.includes(rule_type)) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse(`Invalid rule type. Must be one of: ${validRuleTypes.join(', ')}`)
                );
            }

            const ruleId = crypto.randomBytes(8).toString('hex');

            await User.db.query(`
                INSERT INTO validation_rules (
                    id, name, description, field, rule_type, parameters,
                    error_message, error_message_fa, enabled,
                    apply_to_roles, priority, conditions,
                    created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                ruleId,
                name,
                description || null,
                field,
                rule_type,
                parameters ? JSON.stringify(parameters) : null,
                error_message || `Validation failed for ${field}`,
                error_message_fa || null,
                enabled ? 1 : 0,
                JSON.stringify(apply_to_roles || []),
                priority,
                conditions ? JSON.stringify(conditions) : null,
                req.user.id,
                new Date(),
                new Date()
            ]);

            logger.info('Validation rule created', {
                ruleId,
                name,
                field,
                ruleType: rule_type,
                createdBy: req.user.id
            });

            return res.status(status.CREATED).json(
                successResponse('Validation rule created', { rule_id: ruleId })
            );
        } catch (error) {
            logger.errorWithStack('Create validation rule error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Validate data against rules
     */
    async validateData(data, userRole = null, context = {}) {
        const errors = [];
        const warnings = [];

        try {
            // Get applicable validation rules
            let query = `
                SELECT * FROM validation_rules 
                WHERE enabled = 1
                AND (apply_to_roles = '[]' OR JSON_CONTAINS(apply_to_roles, ?))
                ORDER BY priority DESC, created_at ASC
            `;

            const [rules] = await User.db.query(query, [JSON.stringify(userRole || 'all')]);

            for (const rule of rules) {
                try {
                    // Check conditions
                    if (rule.conditions) {
                        const conditions = JSON.parse(rule.conditions);
                        if (!this.evaluateConditions(conditions, data, context)) {
                            continue; // Skip rule if conditions not met
                        }
                    }

                    const fieldValue = this.getValueFromPath(data, rule.field);
                    const isValid = await this.applyValidationRule(rule, fieldValue, data, context);

                    if (!isValid) {
                        errors.push({
                            field: rule.field,
                            rule: rule.rule_type,
                            message: rule.error_message,
                            message_fa: rule.error_message_fa,
                            rule_id: rule.id
                        });
                    }
                } catch (error) {
                    warnings.push({
                        rule_id: rule.id,
                        error: `Rule evaluation failed: ${error.message}`
                    });
                }
            }

            // Apply rule composition if needed
            await this.applyRuleComposition(rules, errors, data, context);

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            logger.error('Validate data error', error);
            return {
                isValid: false,
                errors: [{ field: 'system', rule: 'system_error', message: 'Validation system error' }],
                warnings: []
            };
        }
    }

    /**
     * Get value from nested path
     */
    getValueFromPath(obj, path) {
        if (!path) return undefined;
        
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }

    /**
     * Evaluate conditions
     */
    evaluateConditions(conditions, data, context) {
        if (!conditions || !conditions.operator) {
            return true;
        }

        const { operator, rules } = conditions;

        switch (operator) {
            case 'AND':
                return rules.every(rule => this.evaluateCondition(rule, data, context));
            case 'OR':
                return rules.some(rule => this.evaluateCondition(rule, data, context));
            case 'NOT':
                return !this.evaluateCondition(rules[0], data, context);
            default:
                return this.evaluateCondition(conditions, data, context);
        }
    }

    /**
     * Evaluate single condition
     */
    evaluateCondition(condition, data, context) {
        const { field, operator, value } = condition;
        const fieldValue = this.getValueFromPath(data, field);

        switch (operator) {
            case 'eq':
                return fieldValue == value;
            case 'neq':
                return fieldValue != value;
            case 'gt':
                return fieldValue > value;
            case 'gte':
                return fieldValue >= value;
            case 'lt':
                return fieldValue < value;
            case 'lte':
                return fieldValue <= value;
            case 'in':
                return Array.isArray(value) && value.includes(fieldValue);
            case 'not_in':
                return Array.isArray(value) && !value.includes(fieldValue);
            case 'contains':
                return String(fieldValue).includes(String(value));
            case 'starts_with':
                return String(fieldValue).startsWith(String(value));
            case 'ends_with':
                return String(fieldValue).endsWith(String(value));
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            case 'not_exists':
                return fieldValue === undefined || fieldValue === null;
            default:
                return false;
        }
    }

    /**
     * Apply validation rule
     */
    async applyValidationRule(rule, value, data, context) {
        const ruleType = rule.rule_type;
        const params = rule.parameters ? JSON.parse(rule.parameters) : {};

        switch (ruleType) {
            case 'required':
                return value !== undefined && value !== null && value !== '';
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return !value || emailRegex.test(value);
            case 'phone':
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                return !value || phoneRegex.test(value.replace(/[^\d+]/g, ''));
            case 'min_length':
                return !value || String(value).length >= (params.min || 0);
            case 'max_length':
                return !value || String(value).length <= (params.max || 255);
            case 'regex':
                return !value || new RegExp(params.pattern || '.*').test(value);
            case 'unique':
                return await this.checkUnique(rule.field, value, context);
            case 'date_format':
                if (!value) return true;
                try {
                    const date = new Date(value);
                    return !isNaN(date.getTime());
                } catch (error) {
                    return false;
                }
            case 'numeric':
                return !value || !isNaN(parseFloat(value)) && isFinite(value);
            case 'boolean':
                return !value || typeof value === 'boolean' || value === 'true' || value === 'false';
            case 'array':
                return !value || Array.isArray(value);
            case 'object':
                return !value || typeof value === 'object' && !Array.isArray(value);
            case 'in':
                return !value || (Array.isArray(params.values) && params.values.includes(value));
            case 'not_in':
                return !value || (Array.isArray(params.values) && !params.values.includes(value));
            case 'custom':
                // For custom rules, you could implement a plugin system
                return await this.applyCustomRule(rule, value, data, context);
            default:
                return true;
        }
    }

    /**
     * Check uniqueness
     */
    async checkUnique(field, value, context) {
        if (!value) return true;

        try {
            const [existing] = await User.db.query(
                `SELECT COUNT(*) as count FROM users WHERE ${field} = ?`,
                [value]
            );

            // If updating, exclude current user
            if (context.userId && existing[0].count > 0) {
                const [current] = await User.db.query(
                    `SELECT ${field} FROM users WHERE id = ?`,
                    [context.userId]
                );
                
                if (current.length > 0 && current[0][field] === value) {
                    return true; // Same value for same user is okay
                }
            }

            return existing[0].count === 0;
        } catch (error) {
            logger.error('Check unique error', error);
            return false;
        }
    }

    /**
     * Apply custom rule
     */
    async applyCustomRule(rule, value, data, context) {
        // This is a placeholder for custom rule logic
        // In a real system, you might have a plugin system or stored procedures
        const params = rule.parameters ? JSON.parse(rule.parameters) : {};
        
        // Example: Check if value matches a pattern in a custom table
        if (params.custom_table && params.custom_field) {
            try {
                const [result] = await User.db.query(
                    `SELECT COUNT(*) as count FROM ${params.custom_table} WHERE ${params.custom_field} = ?`,
                    [value]
                );
                return params.allow ? result[0].count > 0 : result[0].count === 0;
            } catch (error) {
                logger.error('Apply custom rule error', error);
                return false;
            }
        }

        return true;
    }

    /**
     * Apply rule composition
     */
    async applyRuleComposition(rules, errors, data, context) {
        // Find composite rules (rules with composition field)
        const compositeRules = rules.filter(rule => {
            const params = rule.parameters ? JSON.parse(rule.parameters) : {};
            return params.composition;
        });

        for (const rule of compositeRules) {
            const params = JSON.parse(rule.parameters);
            const { composition, fields, operator = 'AND' } = params;

            if (composition === 'combined') {
                const fieldErrors = errors.filter(error => fields.includes(error.field));
                
                if (operator === 'AND' && fieldErrors.length === fields.length) {
                    // All fields have errors, keep them all
                } else if (operator === 'OR' && fieldErrors.length > 0) {
                    // At least one field has error, keep them all
                } else if (operator === 'AND' && fieldErrors.length < fields.length) {
                    // Not all fields have errors, remove these errors
                    errors = errors.filter(error => !fields.includes(error.field));
                }
            }
        }
    }

    /**
     * Get validation rules
     * @route GET /api/v1/users/validation/rules
     * @access Private (Admin)
     */
    async getValidationRules(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                field,
                rule_type,
                enabled,
                role
            } = req.query;

            const offset = (page - 1) * limit;
            let query = `
                SELECT vr.*, u.username as created_by_username
                FROM validation_rules vr
                LEFT JOIN users u ON vr.created_by = u.id
                WHERE 1=1
            `;
            const params = [];

            if (field) {
                query += ' AND vr.field = ?';
                params.push(field);
            }

            if (rule_type) {
                query += ' AND vr.rule_type = ?';
                params.push(rule_type);
            }

            if (enabled !== undefined) {
                query += ' AND vr.enabled = ?';
                params.push(enabled === 'true' ? 1 : 0);
            }

            if (role) {
                query += ' AND JSON_CONTAINS(vr.apply_to_roles, ?)';
                params.push(JSON.stringify(role));
            }

            query += ' ORDER BY vr.priority DESC, vr.created_at ASC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [rules] = await User.db.query(query, params);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM validation_rules'
            );

            // Parse JSON fields
            const parsedRules = rules.map(rule => ({
                ...rule,
                parameters: rule.parameters ? JSON.parse(rule.parameters) : null,
                apply_to_roles: rule.apply_to_roles ? JSON.parse(rule.apply_to_roles) : [],
                conditions: rule.conditions ? JSON.parse(rule.conditions) : null
            }));

            return res.status(status.OK).json(
                paginatedResponse('Validation rules', parsedRules, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get validation rules error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Test validation rule
     * @route POST /api/v1/users/validation/rules/test
     * @access Private (Admin)
     */
    async testValidationRule(req, res) {
        try {
            const { rule, data, context = {} } = req.body;

            if (!rule || !data) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Rule and data are required')
                );
            }

            const validationResult = await this.applyValidationRule(
                rule,
                this.getValueFromPath(data, rule.field),
                data,
                context
            );

            return res.status(status.OK).json(
                successResponse('Validation test completed', {
                    valid: validationResult,
                    field: rule.field,
                    value: this.getValueFromPath(data, rule.field)
                })
            );
        } catch (error) {
            logger.errorWithStack('Test validation rule error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Validate user creation/update with advanced rules
     */
    async validateUserData(userData, operation = 'create', currentUser = null) {
        const context = {
            operation,
            userId: currentUser?.id,
            userRole: currentUser?.role
        };

        return await this.validateData(userData, currentUser?.role, context);
    }

    /**
     * Get validation errors localized
     */
    getLocalizedError(error, locale = 'en') {
        if (locale === 'fa' && error.message_fa) {
            return error.message_fa;
        }
        return error.message;
    }

    // ==================== NEW FEATURE 9: EXTERNAL SYSTEM SYNC ====================

    /**
     * Define external API endpoint
     * @route POST /api/v1/users/sync/endpoints
     * @access Private (Admin)
     */
    async defineSyncEndpoint(req, res) {
        try {
            const {
                name,
                description,
                endpoint_url,
                method = 'POST',
                auth_type = 'none', // none, basic, bearer, api_key
                auth_config,
                headers = {},
                payload_template,
                enabled = true,
                sync_direction = 'outbound', // outbound, inbound, bidirectional
                sync_events = ['user.create', 'user.update'],
                retry_config = {}
            } = req.body;

            if (!name || !endpoint_url) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Name and endpoint_url are required')
                );
            }

            // Validate URL
            try {
                new URL(endpoint_url);
            } catch (error) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Invalid endpoint URL')
                );
            }

            // Validate auth config based on auth type
            if (auth_type !== 'none' && !auth_config) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Auth config is required for this auth type')
                );
            }

            const endpointId = crypto.randomBytes(8).toString('hex');

            await User.db.query(`
                INSERT INTO sync_endpoints (
                    id, name, description, endpoint_url, method, auth_type,
                    auth_config, headers, payload_template, enabled,
                    sync_direction, sync_events, retry_config,
                    created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                endpointId,
                name,
                description || null,
                endpoint_url,
                method,
                auth_type,
                auth_config ? JSON.stringify(auth_config) : null,
                headers ? JSON.stringify(headers) : null,
                payload_template || null,
                enabled ? 1 : 0,
                sync_direction,
                JSON.stringify(sync_events || []),
                JSON.stringify(retry_config || { max_retries: 3, backoff_factor: 2 }),
                req.user.id,
                new Date(),
                new Date()
            ]);

            logger.info('Sync endpoint defined', {
                endpointId,
                name,
                endpointUrl: endpoint_url,
                syncDirection: sync_direction,
                createdBy: req.user.id
            });

            return res.status(status.CREATED).json(
                successResponse('Sync endpoint defined', { endpoint_id: endpointId })
            );
        } catch (error) {
            logger.errorWithStack('Define sync endpoint error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Queue sync job
     */
    async queueSyncJob(endpointId, event, payload, priority = 'normal') {
        try {
            const jobId = crypto.randomBytes(8).toString('hex');

            await User.db.query(`
                INSERT INTO sync_queue (
                    id, endpoint_id, event, payload, priority,
                    status, attempt_count, max_attempts,
                    next_attempt_at, created_at
                ) VALUES (?, ?, ?, ?, ?, 'pending', 0, 3, ?, ?)
            `, [
                jobId,
                endpointId,
                event,
                JSON.stringify(payload),
                priority,
                new Date(), // Immediate attempt
                new Date()
            ]);

            return jobId;
        } catch (error) {
            logger.error('Queue sync job error', error);
            throw error;
        }
    }

    /**
     * Process sync queue
     */
    async processSyncQueue() {
        try {
            const now = new Date();

            // Get pending jobs ready for processing
            const [pendingJobs] = await User.db.query(`
                SELECT sq.*, se.*
                FROM sync_queue sq
                JOIN sync_endpoints se ON sq.endpoint_id = se.id
                WHERE sq.status IN ('pending', 'retrying')
                AND sq.next_attempt_at <= ?
                AND se.enabled = 1
                ORDER BY 
                    CASE sq.priority
                        WHEN 'high' THEN 1
                        WHEN 'medium' THEN 2
                        WHEN 'low' THEN 3
                        ELSE 4
                    END,
                    sq.created_at
                LIMIT 50
            `, [now]);

            const results = await Promise.allSettled(
                pendingJobs.map(job => this.processSyncJob(job))
            );

            const summary = {
                total: pendingJobs.length,
                success: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
                failed: results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
            };

            if (pendingJobs.length > 0) {
                logger.info('Sync queue processed', summary);
            }

            return summary;
        } catch (error) {
            logger.error('Process sync queue error', error);
            return { total: 0, success: 0, failed: 0 };
        }
    }

    /**
     * Process single sync job
     */
    async processSyncJob(job) {
        try {
            // Update job status to processing
            await User.db.query(
                'UPDATE sync_queue SET status = ? WHERE id = ?',
                ['processing', job.id]
            );

            // Prepare request
            const payload = JSON.parse(job.payload);
            const requestConfig = this.prepareSyncRequest(job, payload);

            // Send request
            const response = await fetch(job.endpoint_url, requestConfig);
            const responseText = await response.text();

            // Log attempt
            await this.logSyncAttempt(
                job.id,
                response.status,
                responseText,
                job.attempt_count + 1
            );

            if (response.ok) {
                // Success
                await User.db.query(`
                    UPDATE sync_queue SET 
                        status = 'completed',
                        completed_at = ?,
                        response = ?
                    WHERE id = ?
                `, [new Date(), responseText, job.id]);

                return { success: true, jobId: job.id };
            } else {
                // Failure - retry or move to dead letter
                const nextAttempt = this.calculateNextAttempt(
                    job.attempt_count + 1,
                    job.max_attempts,
                    job.retry_config ? JSON.parse(job.retry_config) : {}
                );

                if (nextAttempt) {
                    // Schedule retry
                    await User.db.query(`
                        UPDATE sync_queue SET 
                            status = 'retrying',
                            attempt_count = attempt_count + 1,
                            next_attempt_at = ?,
                            last_error = ?
                        WHERE id = ?
                    `, [nextAttempt, responseText, job.id]);
                } else {
                    // Move to dead letter
                    await this.moveSyncToDeadLetter(job, responseText);
                }

                return { success: false, jobId: job.id, status: response.status };
            }

        } catch (error) {
            // Network or other error
            await this.logSyncAttempt(job.id, null, error.message, job.attempt_count + 1);

            const nextAttempt = this.calculateNextAttempt(
                job.attempt_count + 1,
                job.max_attempts,
                job.retry_config ? JSON.parse(job.retry_config) : {}
            );

            if (nextAttempt) {
                await User.db.query(`
                    UPDATE sync_queue SET 
                        status = 'retrying',
                        attempt_count = attempt_count + 1,
                        next_attempt_at = ?,
                        last_error = ?
                    WHERE id = ?
                `, [nextAttempt, error.message, job.id]);
            } else {
                await this.moveSyncToDeadLetter(job, error.message);
            }

            return { success: false, jobId: job.id, error: error.message };
        }
    }

    /**
     * Prepare sync request
     */
    prepareSyncRequest(job, payload) {
        const config = {
            method: job.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(job.headers ? JSON.parse(job.headers) : {})
            },
            timeout: 30000 // 30 second timeout
        };

        // Add authentication
        if (job.auth_type !== 'none' && job.auth_config) {
            const authConfig = JSON.parse(job.auth_config);
            switch (job.auth_type) {
                case 'basic':
                    const credentials = `${authConfig.username}:${authConfig.password}`;
                    config.headers['Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`;
                    break;
                case 'bearer':
                    config.headers['Authorization'] = `Bearer ${authConfig.token}`;
                    break;
                case 'api_key':
                    config.headers[authConfig.header_name || 'X-API-Key'] = authConfig.api_key;
                    break;
            }
        }

        // Prepare body
        if (job.payload_template) {
            // Apply template to payload
            const template = JSON.parse(job.payload_template);
            const processedPayload = this.applyTemplate(template, payload);
            config.body = JSON.stringify(processedPayload);
        } else {
            config.body = JSON.stringify(payload);
        }

        return config;
    }

    /**
     * Apply template to payload
     */
    applyTemplate(template, data) {
        if (typeof template === 'string') {
            // Replace placeholders like {{field.path}}
            return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
                return this.getValueFromPath(data, path.trim()) || '';
            });
        } else if (Array.isArray(template)) {
            return template.map(item => this.applyTemplate(item, data));
        } else if (typeof template === 'object' && template !== null) {
            const result = {};
            for (const [key, value] of Object.entries(template)) {
                result[key] = this.applyTemplate(value, data);
            }
            return result;
        }
        return template;
    }

    /**
     * Calculate next attempt time
     */
    calculateNextAttempt(attempt, maxAttempts, retryConfig) {
        if (attempt >= maxAttempts) {
            return null; // No more retries
        }

        const baseDelay = retryConfig.base_delay || 1000; // 1 second
        const backoffFactor = retryConfig.backoff_factor || 2;
        const jitter = retryConfig.jitter || 0.1; // 10% jitter

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
        const jitterAmount = delay * jitter * (Math.random() * 2 - 1);
        const totalDelay = Math.max(delay + jitterAmount, 100);

        const nextAttempt = new Date();
        nextAttempt.setMilliseconds(nextAttempt.getMilliseconds() + totalDelay);

        return nextAttempt;
    }

    /**
     * Log sync attempt
     */
    async logSyncAttempt(jobId, status, response, attempt) {
        try {
            await User.db.query(`
                INSERT INTO sync_attempts (
                    job_id, status, response, attempt, created_at
                ) VALUES (?, ?, ?, ?, ?)
            `, [jobId, status, response, attempt, new Date()]);
        } catch (error) {
            logger.error('Log sync attempt error', error);
        }
    }

    /**
     * Move sync job to dead letter
     */
    async moveSyncToDeadLetter(job, error) {
        try {
            await User.db.query(`
                INSERT INTO sync_dead_letter (
                    job_id, endpoint_id, event, payload, error, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                job.id,
                job.endpoint_id,
                job.event,
                job.payload,
                error,
                new Date()
            ]);

            // Update job status
            await User.db.query(
                'UPDATE sync_queue SET status = ? WHERE id = ?',
                ['failed', job.id]
            );
        } catch (error) {
            logger.error('Move sync to dead letter error', error);
        }
    }

    /**
     * Get sync queue status
     * @route GET /api/v1/users/sync/queue
     * @access Private (Admin)
     */
    async getSyncQueueStatus(req, res) {
        try {
            const {
                status,
                endpoint_id,
                event,
                page = 1,
                limit = 20
            } = req.query;

            const offset = (page - 1) * limit;
            let query = `
                SELECT sq.*, se.name as endpoint_name
                FROM sync_queue sq
                LEFT JOIN sync_endpoints se ON sq.endpoint_id = se.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ' AND sq.status = ?';
                params.push(status);
            }

            if (endpoint_id) {
                query += ' AND sq.endpoint_id = ?';
                params.push(endpoint_id);
            }

            if (event) {
                query += ' AND sq.event = ?';
                params.push(event);
            }

            query += ' ORDER BY sq.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [jobs] = await User.db.query(query, params);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM sync_queue'
            );

            // Parse JSON fields
            const parsedJobs = jobs.map(job => ({
                ...job,
                payload: job.payload ? JSON.parse(job.payload) : null,
                response: job.response ? JSON.parse(job.response) : null
            }));

            // Get queue statistics
            const [stats] = await User.db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = 'retrying' THEN 1 ELSE 0 END) as retrying,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
                FROM sync_queue
            `);

            return res.status(status.OK).json(
                paginatedResponse('Sync queue', parsedJobs, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit),
                    statistics: stats[0]
                })
            );
        } catch (error) {
            logger.errorWithStack('Get sync queue status error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get sync history
     * @route GET /api/v1/users/sync/history
     * @access Private (Admin)
     */
    async getSyncHistory(req, res) {
        try {
            const {
                endpoint_id,
                event,
                status,
                start_date,
                end_date,
                page = 1,
                limit = 20
            } = req.query;

            const offset = (page - 1) * limit;
            let query = `
                SELECT sq.*, se.name as endpoint_name
                FROM sync_queue sq
                LEFT JOIN sync_endpoints se ON sq.endpoint_id = se.id
                WHERE sq.status IN ('completed', 'failed')
            `;
            const params = [];

            if (endpoint_id) {
                query += ' AND sq.endpoint_id = ?';
                params.push(endpoint_id);
            }

            if (event) {
                query += ' AND sq.event = ?';
                params.push(event);
            }

            if (status) {
                query += ' AND sq.status = ?';
                params.push(status);
            }

            if (start_date) {
                query += ' AND sq.created_at >= ?';
                params.push(new Date(start_date));
            }

            if (end_date) {
                query += ' AND sq.created_at <= ?';
                params.push(new Date(end_date));
            }

            query += ' ORDER BY sq.completed_at DESC, sq.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            const [history] = await User.db.query(query, params);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM sync_queue WHERE status IN ("completed", "failed")'
            );

            // Parse JSON fields
            const parsedHistory = history.map(item => ({
                ...item,
                payload: item.payload ? JSON.parse(item.payload) : null,
                response: item.response ? JSON.parse(item.response) : null
            }));

            return res.status(status.OK).json(
                paginatedResponse('Sync history', parsedHistory, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get sync history error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Generate reconciliation report
     * @route GET /api/v1/users/sync/reconciliation
     * @access Private (Admin)
     */
    async generateReconciliationReport(req, res) {
        try {
            const { endpoint_id, start_date, end_date } = req.query;

            if (!endpoint_id) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Endpoint ID is required')
                );
            }

            // Get endpoint details
            const [endpoints] = await User.db.query(
                'SELECT * FROM sync_endpoints WHERE id = ?',
                [endpoint_id]
            );

            if (endpoints.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Endpoint not found')
                );
            }

            const endpoint = endpoints[0];

            // Get sync history for this endpoint
            const dateFilter = start_date ? new Date(start_date) : this.getDateFilter('7d');
            const endDate = end_date ? new Date(end_date) : new Date();

            const [syncHistory] = await User.db.query(`
                SELECT event, status, COUNT(*) as count,
                       MIN(created_at) as first_sync,
                       MAX(created_at) as last_sync
                FROM sync_queue
                WHERE endpoint_id = ? 
                AND created_at BETWEEN ? AND ?
                GROUP BY event, status
                ORDER BY event, status
            `, [endpoint_id, dateFilter, endDate]);

            // Get success rate by hour
            const [hourlyStats] = await User.db.query(`
                SELECT 
                    HOUR(created_at) as hour,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
                    AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as avg_duration_seconds
                FROM sync_queue
                WHERE endpoint_id = ? 
                AND created_at BETWEEN ? AND ?
                AND completed_at IS NOT NULL
                GROUP BY HOUR(created_at)
                ORDER BY hour
            `, [endpoint_id, dateFilter, endDate]);

            // Get recent failures
            const [recentFailures] = await User.db.query(`
                SELECT id, event, last_error, attempt_count, created_at
                FROM sync_queue
                WHERE endpoint_id = ? 
                AND status = 'failed'
                AND created_at BETWEEN ? AND ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [endpoint_id, dateFilter, endDate]);

            const report = {
                endpoint: {
                    id: endpoint.id,
                    name: endpoint.name,
                    url: endpoint.endpoint_url,
                    direction: endpoint.sync_direction
                },
                period: {
                    start: dateFilter,
                    end: endDate
                },
                summary: {
                    total_syncs: syncHistory.reduce((sum, item) => sum + item.count, 0),
                    by_event: syncHistory,
                    success_rate: syncHistory.reduce((sum, item) => 
                        item.status === 'completed' ? sum + item.count : sum, 0
                    ) / (syncHistory.reduce((sum, item) => sum + item.count, 0) || 1) * 100,
                    hourly_stats: hourlyStats,
                    recent_failures: recentFailures
                },
                generated_at: new Date().toISOString(),
                generated_by: req.user.id
            };

            return res.status(status.OK).json(
                successResponse('Reconciliation report generated', report)
            );
        } catch (error) {
            logger.errorWithStack('Generate reconciliation report error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Manually retry failed sync
     * @route POST /api/v1/users/sync/:jobId/retry
     * @access Private (Admin)
     */
    async retryFailedSync(req, res) {
        try {
            const { jobId } = req.params;

            // Get failed job
            const [jobs] = await User.db.query(`
                SELECT sq.*, se.*
                FROM sync_queue sq
                JOIN sync_endpoints se ON sq.endpoint_id = se.id
                WHERE sq.id = ? AND sq.status = 'failed'
            `, [jobId]);

            if (jobs.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Failed job not found')
                );
            }

            const job = jobs[0];

            // Reset job for retry
            await User.db.query(`
                UPDATE sync_queue SET
                    status = 'pending',
                    attempt_count = 0,
                    next_attempt_at = ?,
                    last_error = NULL,
                    updated_at = ?
                WHERE id = ?
            `, [new Date(), new Date(), jobId]);

            logger.info('Sync job retry scheduled', {
                jobId,
                endpointId: job.endpoint_id,
                event: job.event,
                retriedBy: req.user.id
            });

            return res.status(status.OK).json(
                successResponse('Sync job scheduled for retry')
            );
        } catch (error) {
            logger.errorWithStack('Retry failed sync error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Webhook simulation for external systems
     */
    async simulateWebhookForExternalSystem(endpointId, event, payload) {
        try {
            // This method simulates sending data to external systems
            // In a real implementation, this would make actual HTTP requests
            
            const simulationId = crypto.randomBytes(8).toString('hex');
            const timestamp = new Date().toISOString();

            // Log simulation attempt
            await User.db.query(`
                INSERT INTO webhook_simulations (
                    id, endpoint_id, event, payload, status,
                    simulated_at, created_at
                ) VALUES (?, ?, ?, ?, 'simulated', ?, ?)
            `, [
                simulationId,
                endpointId,
                event,
                JSON.stringify(payload),
                timestamp,
                new Date()
            ]);

            // Simulate different response scenarios
            const scenarios = ['success', 'timeout', 'error', 'partial_success'];
            const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

            let response;
            switch (scenario) {
                case 'success':
                    response = { status: 200, message: 'Webhook simulated successfully' };
                    break;
                case 'timeout':
                    response = { status: 504, message: 'Simulated timeout' };
                    break;
                case 'error':
                    response = { status: 500, message: 'Simulated server error' };
                    break;
                case 'partial_success':
                    response = { status: 207, message: 'Simulated partial success' };
                    break;
            }

            // Update simulation with response
            await User.db.query(
                'UPDATE webhook_simulations SET response = ?, status = ? WHERE id = ?',
                [JSON.stringify(response), scenario, simulationId]
            );

            return {
                simulation_id: simulationId,
                scenario,
                response,
                timestamp
            };
        } catch (error) {
            logger.error('Simulate webhook error', error);
            throw error;
        }
    }

    // ==================== NEW FEATURE 10: ADVANCED PROFILE MANAGEMENT ====================

    /**
     * Calculate profile completion percentage
     */
    async _calculateProfileCompletion(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return 0;

            const fields = [
                { field: 'email', weight: 10, check: (u) => u.email && u.email.includes('@') },
                { field: 'username', weight: 10, check: (u) => u.username && u.username.length >= 3 },
                { field: 'first_name', weight: 15, check: (u) => u.first_name && u.first_name.trim().length > 0 },
                { field: 'last_name', weight: 15, check: (u) => u.last_name && u.last_name.trim().length > 0 },
                { field: 'phone', weight: 10, check: (u) => u.phone && u.phone.length >= 10 },
                { field: 'avatar', weight: 10, check: (u) => u.avatar && u.avatar.trim().length > 0 },
                { field: 'bio', weight: 5, check: (u) => u.bio && u.bio.trim().length > 0 },
                { field: 'email_verified', weight: 15, check: (u) => u.is_verified === 1 },
                { field: 'phone_verified', weight: 10, check: (u) => u.phone_verified_at !== null }
            ];

            let totalWeight = 0;
            let completedWeight = 0;

            for (const field of fields) {
                totalWeight += field.weight;
                if (field.check(user)) {
                    completedWeight += field.weight;
                }
            }

            return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
        } catch (error) {
            logger.error('Calculate profile completion error', error);
            return 0;
        }
    }

    /**
     * Merge user data (for account merging feature)
     */
    async _mergeUserData(sourceUserId, targetUserId, mergeOptions = {}) {
        try {
            // Start transaction
            const connection = await User.db.getConnection();
            await connection.beginTransaction();

            try {
                // Get both users
                const [sourceUser] = await User.db.query(
                    'SELECT * FROM users WHERE id = ?',
                    [sourceUserId]
                );
                const [targetUser] = await User.db.query(
                    'SELECT * FROM users WHERE id = ?',
                    [targetUserId]
                );

                if (sourceUser.length === 0 || targetUser.length === 0) {
                    throw new Error('One or both users not found');
                }

                const source = sourceUser[0];
                const target = targetUser[0];

                // Create merge record
                const mergeId = crypto.randomBytes(8).toString('hex');
                await connection.query(`
                    INSERT INTO user_merges (
                        id, source_user_id, target_user_id, merge_options,
                        merged_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    mergeId,
                    sourceUserId,
                    targetUserId,
                    JSON.stringify(mergeOptions),
                    mergeOptions.merged_by || null,
                    new Date()
                ]);

                // Merge data based on options
                const updates = {};
                
                // Merge email if target doesn't have one
                if (!target.email && source.email && mergeOptions.merge_email !== false) {
                    updates.email = source.email;
                    updates.is_verified = source.is_verified;
                    updates.email_verified_at = source.email_verified_at;
                }

                // Merge phone
                if (!target.phone && source.phone && mergeOptions.merge_phone !== false) {
                    updates.phone = source.phone;
                    updates.phone_verified_at = source.phone_verified_at;
                }

                // Merge names
                if (!target.first_name && source.first_name && mergeOptions.merge_names !== false) {
                    updates.first_name = source.first_name;
                }
                if (!target.last_name && source.last_name && mergeOptions.merge_names !== false) {
                    updates.last_name = source.last_name;
                }

                // Merge avatar
                if (!target.avatar && source.avatar && mergeOptions.merge_avatar !== false) {
                    updates.avatar = source.avatar;
                }

                // Merge bio
                if (!target.bio && source.bio && mergeOptions.merge_bio !== false) {
                    updates.bio = source.bio;
                }

                // Merge meta data
                if (source.meta && mergeOptions.merge_meta !== false) {
                    const sourceMeta = JSON.parse(source.meta);
                    const targetMeta = target.meta ? JSON.parse(target.meta) : {};
                    const mergedMeta = { ...sourceMeta, ...targetMeta };
                    updates.meta = JSON.stringify(mergedMeta);
                }

                // Update target user
                if (Object.keys(updates).length > 0) {
                    updates.updated_at = new Date();
                    await connection.query(
                        `UPDATE users SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
                        [...Object.values(updates), targetUserId]
                    );
                }

                // Migrate related data
                await this.migrateUserData(connection, sourceUserId, targetUserId, mergeOptions);

                // Deactivate source user
                await connection.query(`
                    UPDATE users SET 
                        is_active = 0,
                        merged_into = ?,
                        merged_at = ?,
                        updated_at = ?
                    WHERE id = ?
                `, [targetUserId, new Date(), new Date(), sourceUserId]);

                // Commit transaction
                await connection.commit();

                logger.security('USER_MERGE_COMPLETED', {
                    mergeId,
                    sourceUserId,
                    targetUserId,
                    mergedBy: mergeOptions.merged_by
                });

                return {
                    merge_id: mergeId,
                    source_user: sourceUserId,
                    target_user: targetUserId,
                    updates_applied: Object.keys(updates),
                    success: true
                };

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        } catch (error) {
            logger.error('Merge user data error', error);
            throw error;
        }
    }

    /**
     * Migrate user data during merge
     */
    async migrateUserData(connection, sourceUserId, targetUserId, mergeOptions) {
        const tablesToMigrate = [
            'user_sessions',
            'user_activities',
            'user_logins',
            'notifications',
            'user_permissions',
            'trusted_devices'
        ];

        for (const table of tablesToMigrate) {
            if (mergeOptions[`migrate_${table}`] !== false) {
                try {
                    await connection.query(
                        `UPDATE ${table} SET user_id = ? WHERE user_id = ?`,
                        [targetUserId, sourceUserId]
                    );
                } catch (error) {
                    logger.warn(`Failed to migrate ${table}`, { error: error.message });
                }
            }
        }
    }

    /**
     * Get profile version history
     * @route GET /api/v1/users/:id/profile/versions
     * @access Private (Admin)
     */
    async getProfileVersions(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const offset = (page - 1) * limit;

            const [versions] = await User.db.query(`
                SELECT id, user_id, version_data, changes, created_by,
                       created_at, version_number, is_current
                FROM profile_versions
                WHERE user_id = ?
                ORDER BY version_number DESC
                LIMIT ? OFFSET ?
            `, [id, parseInt(limit), offset]);

            const [count] = await User.db.query(
                'SELECT COUNT(*) as total FROM profile_versions WHERE user_id = ?',
                [id]
            );

            // Parse JSON fields
            const parsedVersions = versions.map(version => ({
                ...version,
                version_data: version.version_data ? JSON.parse(version.version_data) : null,
                changes: version.changes ? JSON.parse(version.changes) : null
            }));

            return res.status(status.OK).json(
                paginatedResponse('Profile versions', parsedVersions, {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count[0].total,
                    totalPages: Math.ceil(count[0].total / limit)
                })
            );
        } catch (error) {
            logger.errorWithStack('Get profile versions error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Create profile version snapshot
     */
    async createProfileVersion(userId, changes, changedBy = null) {
        try {
            // Get current user data
            const user = await User.findById(userId);
            if (!user) return null;

            // Get current version number
            const [maxVersion] = await User.db.query(`
                SELECT MAX(version_number) as max_version 
                FROM profile_versions 
                WHERE user_id = ?
            `, [userId]);

            const versionNumber = (maxVersion[0].max_version || 0) + 1;

            // Mark previous versions as not current
            await User.db.query(
                'UPDATE profile_versions SET is_current = 0 WHERE user_id = ?',
                [userId]
            );

            // Create new version
            const versionId = crypto.randomBytes(8).toString('hex');
            
            // Remove sensitive fields from snapshot
            const { password, temp_password, verification_token, reset_token, ...snapshot } = user;

            await User.db.query(`
                INSERT INTO profile_versions (
                    id, user_id, version_number, version_data,
                    changes, created_by, is_current, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            `, [
                versionId,
                userId,
                versionNumber,
                JSON.stringify(snapshot),
                JSON.stringify(changes),
                changedBy,
                new Date()
            ]);

            // Enforce version limit
            await this.enforceVersionLimit(userId);

            return versionId;
        } catch (error) {
            logger.error('Create profile version error', error);
            return null;
        }
    }

    /**
     * Enforce profile version limit
     */
    async enforceVersionLimit(userId) {
        try {
            // Count versions
            const [countResult] = await User.db.query(
                'SELECT COUNT(*) as count FROM profile_versions WHERE user_id = ?',
                [userId]
            );

            const count = countResult[0].count;

            if (count > this.profileVersionLimit) {
                // Delete oldest versions
                const toDelete = count - this.profileVersionLimit;
                await User.db.query(`
                    DELETE FROM profile_versions 
                    WHERE user_id = ? 
                    AND is_current = 0
                    ORDER BY version_number ASC
                    LIMIT ?
                `, [userId, toDelete]);
            }
        } catch (error) {
            logger.error('Enforce version limit error', error);
        }
    }

    /**
     * Rollback to previous profile version
     * @route POST /api/v1/users/:id/profile/rollback/:versionId
     * @access Private (Admin)
     */
    async rollbackProfileVersion(req, res) {
        try {
            const { id, versionId } = req.params;
            const { reason } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // Get version data
            const [versions] = await User.db.query(`
                SELECT * FROM profile_versions
                WHERE id = ? AND user_id = ?
            `, [versionId, id]);

            if (versions.length === 0) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse('Profile version not found')
                );
            }

            const version = versions[0];
            const versionData = JSON.parse(version.version_data);

            // Check permissions
            if (!await this.canManageRole(req.user.role, user.role)) {
                return res.status(status.FORBIDDEN).json(
                    errorResponse('You do not have permission to rollback this user')
                );
            }

            // Start transaction
            const connection = await User.db.getConnection();
            await connection.beginTransaction();

            try {
                // Create backup of current state before rollback
                await this.createProfileVersion(id, {
                    type: 'pre_rollback_backup',
                    rolled_back_from_version: version.version_number,
                    reason
                }, req.user.id);

                // Update user with version data (excluding sensitive fields)
                const updateData = {
                    first_name: versionData.first_name,
                    last_name: versionData.last_name,
                    email: versionData.email,
                    phone: versionData.phone,
                    avatar: versionData.avatar,
                    cover: versionData.cover,
                    bio: versionData.bio,
                    meta: versionData.meta,
                    updated_at: new Date(),
                    updated_by: req.user.id
                };

                await connection.query(
                    `UPDATE users SET ${Object.keys(updateData).map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
                    [...Object.values(updateData), id]
                );

                // Mark this version as current
                await connection.query(
                    'UPDATE profile_versions SET is_current = 0 WHERE user_id = ?',
                    [id]
                );
                await connection.query(
                    'UPDATE profile_versions SET is_current = 1 WHERE id = ?',
                    [versionId]
                );

                // Create audit log
                await connection.query(`
                    INSERT INTO profile_rollback_audit (
                        user_id, version_id, version_number,
                        rolled_back_by, reason, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [id, versionId, version.version_number, req.user.id, reason, new Date()]);

                await connection.commit();

                // Invalidate cache
                await cache.del(`${this.cachePrefix}${id}*`);

                logger.security('PROFILE_ROLLBACK', {
                    userId: id,
                    versionId,
                    versionNumber: version.version_number,
                    rolledBackBy: req.user.id,
                    reason
                });

                return res.status(status.OK).json(
                    successResponse('Profile rolled back successfully', {
                        version_number: version.version_number,
                        rolled_back_fields: Object.keys(updateData).filter(k => !['updated_at', 'updated_by'].includes(k))
                    })
                );

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            logger.errorWithStack('Rollback profile version error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Process avatar (simulated resize/crop)
     */
    async processAvatar(avatarData, options = {}) {
        try {
            // In a real application, this would use an image processing library
            // This is a simulated implementation
            
            const processed = {
                original: avatarData,
                processed_at: new Date().toISOString(),
                operations: []
            };

            // Simulate resize
            if (options.width || options.height) {
                processed.operations.push({
                    type: 'resize',
                    width: options.width || 'auto',
                    height: options.height || 'auto'
                });
            }

            // Simulate crop
            if (options.crop) {
                processed.operations.push({
                    type: 'crop',
                    x: options.crop.x || 0,
                    y: options.crop.y || 0,
                    width: options.crop.width || 100,
                    height: options.crop.height || 100
                });
            }

            // Simulate format conversion
            if (options.format) {
                processed.operations.push({
                    type: 'format',
                    format: options.format
                });
            }

            // Generate different sizes
            processed.sizes = {
                thumbnail: `${avatarData}_thumbnail`,
                small: `${avatarData}_small`,
                medium: `${avatarData}_medium`,
                large: `${avatarData}_large`,
                original: avatarData
            };

            return processed;
        } catch (error) {
            logger.error('Process avatar error', error);
            throw error;
        }
    }

    /**
     * Update avatar
     * @route POST /api/v1/users/:id/profile/avatar
     * @access Private (Admin)
     */
    async updateAvatar(req, res) {
        try {
            const { id } = req.params;
            const { avatar_url, process_options = {} } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            if (!avatar_url) {
                return res.status(status.BAD_REQUEST).json(
                    errorResponse('Avatar URL is required')
                );
            }

            // Process avatar
            const processedAvatar = await this.processAvatar(avatar_url, process_options);

            // Create profile version before update
            await this.createProfileVersion(id, {
                type: 'avatar_update',
                old_avatar: user.avatar,
                new_avatar: avatar_url,
                process_options
            }, req.user.id);

            // Update user
            await User.update(id, {
                avatar: avatar_url,
                avatar_processed: JSON.stringify(processedAvatar),
                avatar_updated_at: new Date(),
                avatar_updated_by: req.user.id,
                updated_at: new Date()
            });

            // Invalidate cache
            await cache.del(`${this.cachePrefix}${id}*`);

            logger.info('Avatar updated', {
                userId: id,
                updatedBy: req.user.id
            });

            return res.status(status.OK).json(
                successResponse('Avatar updated successfully', {
                    avatar_url,
                    processed: processedAvatar
                })
            );
        } catch (error) {
            logger.errorWithStack('Update avatar error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get profile completion status
     * @route GET /api/v1/users/:id/profile/completion
     * @access Private (Admin)
     */
    async getProfileCompletion(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const completionPercentage = await this._calculateProfileCompletion(id);
            
            // Get missing fields
            const missingFields = await this.getMissingProfileFields(id);

            const status = {
                completion_percentage: completionPercentage,
                missing_fields: missingFields,
                last_updated: user.updated_at,
                last_profile_completion_check: new Date().toISOString()
            };

            return res.status(status.OK).json(
                successResponse('Profile completion status', status)
            );
        } catch (error) {
            logger.errorWithStack('Get profile completion error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get missing profile fields
     */
    async getMissingProfileFields(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) return [];

            const fields = [
                { name: 'email', description: 'Email address', value: user.email, required: true },
                { name: 'first_name', description: 'First name', value: user.first_name, required: true },
                { name: 'last_name', description: 'Last name', value: user.last_name, required: true },
                { name: 'phone', description: 'Phone number', value: user.phone, required: false },
                { name: 'avatar', description: 'Profile picture', value: user.avatar, required: false },
                { name: 'bio', description: 'Biography', value: user.bio, required: false },
                { name: 'email_verified', description: 'Email verified', value: user.is_verified === 1, required: true },
                { name: 'phone_verified', description: 'Phone verified', value: user.phone_verified_at !== null, required: false }
            ];

            return fields
                .filter(field => !field.value && field.required)
                .map(field => ({
                    field: field.name,
                    description: field.description,
                    priority: field.required ? 'high' : 'medium'
                }));
        } catch (error) {
            logger.error('Get missing profile fields error', error);
            return [];
        }
    }

    /**
     * Update security settings
     * @route PUT /api/v1/users/:id/profile/security
     * @access Private (Admin)
     */
    async updateSecuritySettings(req, res) {
        try {
            const { id } = req.params;
            const {
                login_alerts = true,
                session_timeout_minutes = 60,
                require_mfa = false,
                password_expiry_days = 90,
                max_login_attempts = 5,
                lockout_duration_minutes = 15,
                trusted_devices_only = false
            } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // Check permissions
            if (!await this.canManageRole(req.user.role, user.role)) {
                return res.status(status.FORBIDDEN).json(
                    errorResponse('You do not have permission to update security settings for this user')
                );
            }

            const settings = {
                login_alerts,
                session_timeout_minutes,
                require_mfa,
                password_expiry_days,
                max_login_attempts,
                lockout_duration_minutes,
                trusted_devices_only,
                updated_at: new Date(),
                updated_by: req.user.id
            };

            await User.db.query(`
                INSERT INTO user_security_settings (
                    user_id, settings, updated_at, updated_by
                ) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    settings = ?,
                    updated_at = ?,
                    updated_by = ?
            `, [
                id,
                JSON.stringify(settings),
                new Date(),
                req.user.id,
                JSON.stringify(settings),
                new Date(),
                req.user.id
            ]);

            // Create audit log
            await this._createAuditLog(id, 'SECURITY_SETTINGS_UPDATED', {
                updated_by: req.user.id,
                settings,
                previous_settings: user.security_settings ? JSON.parse(user.security_settings) : null
            });

            logger.security('SECURITY_SETTINGS_UPDATED', {
                userId: id,
                updatedBy: req.user.id,
                settings
            });

            return res.status(status.OK).json(
                successResponse('Security settings updated', {
                    user_id: id,
                    settings
                })
            );
        } catch (error) {
            logger.errorWithStack('Update security settings error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Export user data (GDPR style)
     * @route GET /api/v1/users/:id/profile/export
     * @access Private (Admin)
     */
    async exportUserData(req, res) {
        try {
            const { id } = req.params;
            const { format = 'json', include_sensitive = false } = req.query;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            // Gather all user data
            const userData = await this.gatherUserData(id, include_sensitive === 'true');

            // Create export record
            const exportId = crypto.randomBytes(8).toString('hex');
            await User.db.query(`
                INSERT INTO data_exports (
                    id, user_id, requested_by, format,
                    status, created_at
                ) VALUES (?, ?, ?, ?, 'completed', ?)
            `, [exportId, id, req.user.id, format, new Date()]);

            // Format based on requested format
            let exportContent;
            let contentType;
            let filename;

            switch (format) {
                case 'json':
                    exportContent = JSON.stringify(userData, null, 2);
                    contentType = 'application/json';
                    filename = `user_${id}_data_${Date.now()}.json`;
                    break;
                case 'csv':
                    exportContent = this.convertUserDataToCSV(userData);
                    contentType = 'text/csv';
                    filename = `user_${id}_data_${Date.now()}.csv`;
                    break;
                case 'zip':
                    // In a real implementation, create a ZIP file with multiple formats
                    exportContent = JSON.stringify({
                        message: 'ZIP export would be generated here with all user data files',
                        export_id: exportId,
                        generated_at: new Date().toISOString()
                    });
                    contentType = 'application/json';
                    filename = `user_${id}_data_${Date.now()}.json`;
                    break;
                default:
                    exportContent = JSON.stringify(userData);
                    contentType = 'application/json';
                    filename = `user_${id}_data_${Date.now()}.json`;
            }

            // Log the export
            logger.security('USER_DATA_EXPORTED', {
                userId: id,
                exportId,
                requestedBy: req.user.id,
                format,
                includeSensitive: include_sensitive === 'true'
            });

            // Set response headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('X-Export-ID', exportId);
            res.setHeader('X-Export-Date', new Date().toISOString());

            return res.send(exportContent);
        } catch (error) {
            logger.errorWithStack('Export user data error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Gather all user data
     */
    async gatherUserData(userId, includeSensitive = false) {
        try {
            const [
                userBasic,
                userSessions,
                userActivities,
                userLogins,
                userNotifications,
                userPermissions,
                trustedDevices,
                securitySettings,
                profileVersions,
                auditLogs,
                mfaData
            ] = await Promise.all([
                // Basic user data
                User.db.query('SELECT * FROM users WHERE id = ?', [userId]),
                // Sessions
                User.db.query('SELECT * FROM user_sessions WHERE user_id = ?', [userId]),
                // Activities
                User.db.query('SELECT * FROM user_activities WHERE user_id = ?', [userId]),
                // Logins
                User.db.query('SELECT * FROM user_logins WHERE user_id = ?', [userId]),
                // Notifications
                User.db.query('SELECT * FROM notifications WHERE user_id = ?', [userId]),
                // Permissions
                User.db.query(`
                    SELECT up.*, p.name as permission_name, p.description
                    FROM user_permissions up
                    JOIN permissions p ON up.permission_id = p.id
                    WHERE up.user_id = ?
                `, [userId]),
                // Trusted devices
                User.db.query('SELECT * FROM trusted_devices WHERE user_id = ?', [userId]),
                // Security settings
                User.db.query('SELECT * FROM user_security_settings WHERE user_id = ?', [userId]),
                // Profile versions
                User.db.query('SELECT * FROM profile_versions WHERE user_id = ?', [userId]),
                // Audit logs
                User.db.query('SELECT * FROM audit_logs WHERE user_id = ?', [userId]),
                // MFA data
                User.db.query(`
                    SELECT two_factor_enabled, two_factor_enabled_at,
                           backup_codes_regenerated_at, mfa_recovery_used_at
                    FROM users WHERE id = ?
                `, [userId])
            ]);

            // Process user data to remove sensitive information if not included
            let processedUserData = userBasic[0][0];
            if (!includeSensitive) {
                const { password, temp_password, verification_token, reset_token, two_factor_secret, ...safeData } = processedUserData;
                processedUserData = safeData;
            }

            const data = {
                user: processedUserData,
                sessions: userSessions[0],
                activities: userActivities[0],
                logins: userLogins[0],
                notifications: userNotifications[0],
                permissions: userPermissions[0],
                trusted_devices: trustedDevices[0],
                security_settings: securitySettings[0] ? JSON.parse(securitySettings[0].settings) : null,
                profile_versions: profileVersions[0].map(v => ({
                    ...v,
                    version_data: v.version_data ? JSON.parse(v.version_data) : null,
                    changes: v.changes ? JSON.parse(v.changes) : null
                })),
                audit_logs: auditLogs[0].map(l => ({
                    ...l,
                    metadata: l.metadata ? JSON.parse(l.metadata) : null
                })),
                mfa: mfaData[0][0],
                export_metadata: {
                    exported_at: new Date().toISOString(),
                    user_id: userId,
                    data_points: [
                        userSessions[0].length,
                        userActivities[0].length,
                        userLogins[0].length,
                        userNotifications[0].length,
                        userPermissions[0].length,
                        trustedDevices[0].length,
                        profileVersions[0].length,
                        auditLogs[0].length
                    ].reduce((a, b) => a + b, 0)
                }
            };

            return data;
        } catch (error) {
            logger.error('Gather user data error', error);
            throw error;
        }
    }

    /**
     * Convert user data to CSV
     */
    convertUserDataToCSV(userData) {
        // Flatten user data for CSV
        const rows = [];
        
        // Add user info
        rows.push(['Section', 'Field', 'Value']);
        rows.push(['User', 'ID', userData.user.id]);
        rows.push(['User', 'Username', userData.user.username]);
        rows.push(['User', 'Email', userData.user.email]);
        rows.push(['User', 'First Name', userData.user.first_name]);
        rows.push(['User', 'Last Name', userData.user.last_name]);
        rows.push(['User', 'Created At', userData.user.created_at]);
        
        // Add counts
        rows.push(['Summary', 'Total Sessions', userData.sessions.length]);
        rows.push(['Summary', 'Total Activities', userData.activities.length]);
        rows.push(['Summary', 'Total Logins', userData.logins.length]);
        rows.push(['Summary', 'Total Notifications', userData.notifications.length]);
        
        // Convert to CSV string
        return rows.map(row => 
            row.map(cell => 
                typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
                    ? `"${cell.replace(/"/g, '""')}"`
                    : cell
            ).join(',')
        ).join('\n');
    }

    /**
     * Get user security settings
     * @route GET /api/v1/users/:id/profile/security
     * @access Private (Admin)
     */
    async getSecuritySettings(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const [settings] = await User.db.query(
                'SELECT settings FROM user_security_settings WHERE user_id = ?',
                [id]
            );

            const defaultSettings = {
                login_alerts: true,
                session_timeout_minutes: 60,
                require_mfa: false,
                password_expiry_days: 90,
                max_login_attempts: 5,
                lockout_duration_minutes: 15,
                trusted_devices_only: false
            };

            const userSettings = settings.length > 0 
                ? JSON.parse(settings[0].settings)
                : defaultSettings;

            return res.status(status.OK).json(
                successResponse('Security settings retrieved', userSettings)
            );
        } catch (error) {
            logger.errorWithStack('Get security settings error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

    /**
     * Get user profile statistics
     * @route GET /api/v1/users/:id/profile/stats
     * @access Private (Admin)
     */
    async getProfileStats(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return res.status(status.NOT_FOUND).json(
                    errorResponse(messages.USER_NOT_FOUND)
                );
            }

            const [
                completionPercentage,
                versionCount,
                lastUpdated,
                avatarInfo,
                securitySettings
            ] = await Promise.all([
                this._calculateProfileCompletion(id),
                User.db.query('SELECT COUNT(*) as count FROM profile_versions WHERE user_id = ?', [id]),
                User.db.query('SELECT MAX(updated_at) as last_updated FROM users WHERE id = ?', [id]),
                User.db.query('SELECT avatar, avatar_updated_at FROM users WHERE id = ?', [id]),
                User.db.query('SELECT settings FROM user_security_settings WHERE user_id = ?', [id])
            ]);

            const stats = {
                profile_completion: completionPercentage,
                profile_versions: versionCount[0][0].count,
                last_updated: lastUpdated[0][0].last_updated,
                has_avatar: !!avatarInfo[0][0].avatar,
                avatar_last_updated: avatarInfo[0][0].avatar_updated_at,
                security_settings_configured: securitySettings[0].length > 0,
                mfa_enabled: user.two_factor_enabled === 1,
                email_verified: user.is_verified === 1,
                phone_verified: user.phone_verified_at !== null,
                account_age_days: Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24))
            };

            return res.status(status.OK).json(
                successResponse('Profile statistics retrieved', stats)
            );
        } catch (error) {
            logger.errorWithStack('Get profile stats error', error);
            return res.status(status.INTERNAL_SERVER_ERROR).json(
                errorResponse(messages.INTERNAL_SERVER_ERROR)
            );
        }
    }

}





module.exports = {
    getAllUsers,
    getUserStats,
    searchUsers,
    getUserById,
    createUser,
    updateUser,
    changeUserRole,
    resetUserPassword,
    deleteUser,
    toggleUserStatus,
    suspendUser,
    unsuspendUser,
    exportUsers,
    bulkAction,
    getUserActivity,
    verifyEmail,
    verifyPhone,
    getUserDetailedStats,
    getDailyRegistrations,
    getUserRecentActivity,
    getUserActiveSessions,
    getUserDevices,
    getUserPermissions,
    deleteUserRelatedData,
    invalidateUserSessions,
    bulkDelete,
    bulkUpdate,
    bulkSuspend,
    bulkSendEmail,
    getRoleHierarchy,
    canManageRole,
    getFieldPermissions,
    applyFieldPermissions,
    createRoleChangeAudit,
    createRoleApprovalRequest,
    notifyRoleApproval,
    processRoleApproval,
    getRoleChangeHistory,
    getPendingRoleApprovals,
    setupMFA,
    setupTOTPMFA,
    verifyMFASetup,
    addTrustedDevice,
    disableMFA,
    getMFAStatus,
    regenerateBackupCodes,
    initiateMFARecovery,
    checkMFARecoveryRateLimit,
    logMFARecoveryAttempt,
    completeMFARecovery,
    _detectSuspiciousActivity,
    sendSuspiciousActivityAlert,
    _createAuditLog,
    getUserSessions,
    terminateUserSession,
    terminateAllUserSessions,
    getSessionStats,
    getSessionMapData,
    enforceSessionLimits,
    updateSessionActivity,
    cleanupExpiredSessions,
    getSessionAnalytics,
    generateGrowthReport,
    generateAdminActivityReport,
    generateRetentionReport,
    calculateRetentionCohorts,
    calculateChurnAnalysis,
    saveReportTemplate,
    getReportTemplates,
    scheduleReport,
    processScheduledReports,
    generateReportByType,
    sendScheduledReport,
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    _pruneOldNotifications,
    getNotificationStats,
    sendBatchNotifications,
    getNotificationPreferences,
    updateNotificationPreferences,
    _validateBulkData,
    bulkImportUsers,
    bulkExportUsers,
    bulkUpdateUsers,
    bulkDeleteUsers,
    bulkRestoreUsers,
    getBulkOperationStatus,
    createBulkOperation,
    updateBulkOperationProgress,
    _sendWebhookWithRetry,
    logWebhookAttempt,
    moveToDeadLetterQueue,
    registerWebhook,
    checkWebhookHealth,
    getWebhooks,
    updateWebhook,
    deleteWebhook,
    getWebhookLogs,
    triggerWebhook,
    getDeadLetterQueue,
    retryDeadLetterItem,
    createValidationRule,
    validateData,
    applyValidationRule,
    checkUnique,
    applyCustomRule,
    applyRuleComposition,
    getValidationRules,
    testValidationRule,
    validateUserData,
    defineSyncEndpoint,
    queueSyncJob,
    processSyncQueue,
    processSyncJob,
    logSyncAttempt,
    moveSyncToDeadLetter,
    getSyncQueueStatus,
    getSyncHistory,
    generateReconciliationReport,
    retryFailedSync,
    simulateWebhookForExternalSystem,
    _calculateProfileCompletion,
    _mergeUserData,
    migrateUserData,
    getProfileVersions,
    createProfileVersion,
    enforceVersionLimit,
    rollbackProfileVersion,
    processAvatar,
    updateAvatar,
    getProfileCompletion,
    getMissingProfileFields,
    updateSecuritySettings,
    exportUserData,
    gatherUserData,
    getSecuritySettings,
    getProfileStats
};
