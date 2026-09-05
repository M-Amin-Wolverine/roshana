/* ============================================
   GLOBAL VARIABLES & STATE
============================================ */
let currentPage = 'dashboard';
let trafficChart, statusChart, topDomainsChart, topUsersChart, responseTimeChart, categoryChart;
let logsTable, domainsTable, anomaliesTable, usersTable;
let isLiveLogActive = true;
let deleteCallback = null;
let isDarkMode = false;

/* ============================================
   INITIALIZATION
============================================ */
$(document).ready(function() {
    // Hide loading overlay
    setTimeout(() => {
        $('#loadingOverlay').fadeOut(300);
    }, 500);

    // Initialize DataTables
    initializeDataTables();

    // Initialize Select2
    $('.form-select').select2();

    // Load initial page
    loadPage('dashboard');

    // Setup event listeners
    setupEventListeners();

    // Auto-refresh dashboard every 30 seconds
    setInterval(() => {
        if (currentPage === 'dashboard') {
            loadDashboardData();
        }
    }, 30000);

    // Auto-refresh logs every 5 seconds if live
    setInterval(() => {
        if (currentPage === 'logs' && isLiveLogActive) {
            loadLiveLogs();
        }
    }, 5000);

    // Keyboard shortcuts
    $(document).keydown(function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            $('#globalSearch').focus();
        }
        if (e.key === 'Escape') {
            $('.modal').modal('hide');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
    });
});

/* ============================================
   DATA TABLES INITIALIZATION
============================================ */
function initializeDataTables() {
    const persianLang = {
        "emptyTable": "داده‌ای در جدول وجود ندارد",
        "info": "نمایش _START_ تا _END_ از _TOTAL_ ردیف",
        "infoEmpty": "نمایش ۰ تا ۰ از ۰ ردیف",
        "infoFiltered": "(فیلتر شده از _MAX_ ردیف)",
        "lengthMenu": "نمایش _MENU_ ردیف",
        "loadingRecords": "در حال بارگذاری...",
        "processing": "در حال پردازش...",
        "search": "جستجو:",
        "zeroRecords": "ردیفی با این مشخصات یافت نشد",
        "paginate": {
            "first": "اولین",
            "last": "آخرین",
            "next": "بعدی",
            "previous": "قبلی"
        },
        "aria": {
            "sortAscending": ": فعال‌سازی مرتب‌سازی صعودی",
            "sortDescending": ": فعال‌سازی مرتب‌سازی نزولی"
        }
    };

    if ($('#domainsTable').length) {
        domainsTable = $('#domainsTable').DataTable({
            language: persianLang,
            pageLength: 25,
            order: [[1, 'asc']],
            columnDefs: [
                { orderable: false, targets: [0, 7] }
            ]
        });

        $('#domainSearch, #domainCategoryFilter, #domainAccessFilter, #domainStatusFilter').on('change keyup', function() {
            domainsTable.search(
                $('#domainSearch').val() + ' ' +
                $('#domainCategoryFilter').val() + ' ' +
                $('#domainAccessFilter').val() + ' ' +
                $('#domainStatusFilter').val()
            ).draw();
        });
    }

    if ($('#logsTable').length) {
        logsTable = $('#logsTable').DataTable({
            language: persianLang,
            pageLength: 50,
            order: [[0, 'desc']],
            columnDefs: [
                { orderable: false, targets: [8] }
            ]
        });
    }

    if ($('#anomaliesTable').length) {
        anomaliesTable = $('#anomaliesTable').DataTable({
            language: persianLang,
            pageLength: 25,
            order: [[0, 'desc']]
        });
    }

    if ($('#usersTable').length) {
        usersTable = $('#usersTable').DataTable({
            language: persianLang,
            pageLength: 25,
            order: [[0, 'asc']]
        });
    }

    if ($('#recentActivityTable').length) {
        $('#recentActivityTable').DataTable({
            language: persianLang,
            pageLength: 10,
            order: [[0, 'desc']]
        });
    }
}

/* ============================================
   EVENT LISTENERS
============================================ */
function setupEventListeners() {
    $('.menu-item[data-page]').click(function() {
        const page = $(this).data('page');
        navigateToPage(page);
    });

    $('#globalSearch').on('keyup', debounce(function() {
        const query = $(this).val();
        if (query.length >= 3) {
            performGlobalSearch(query);
        }
    }, 300));

    $('#selectAllDomains').change(function() {
        const checked = $(this).prop('checked');
        $('#domainsTable tbody input[type="checkbox"]').prop('checked', checked);
    });

    $('.toggle-switch input').change(function() {
        const settingId = $(this).attr('id');
        const value = $(this).prop('checked');
        saveSetting(settingId, value);
    });

    $('#csvFileInput').change(function() {
        const file = this.files[0];
        if (file && !file.name.endsWith('.csv')) {
            showToast('error', 'خطا', 'فرمت فایل باید CSV باشد');
            $(this).val('');
        }
    });
}

/* ============================================
   PAGE NAVIGATION
============================================ */
function navigateToPage(page) {
    $('.menu-item').removeClass('active');
    $(`.menu-item[data-page="${page}"]`).addClass('active');

    $('.page').removeClass('active').hide();
    $(`#page-${page}`).addClass('active').show();

    currentPage = page;
    loadPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadPage(page) {
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'domains':
            loadDomains();
            break;
        case 'policies':
            loadPolicies();
            break;
        case 'logs':
            loadLogs();
            break;
        case 'anomalies':
            loadAnomalies();
            break;
        case 'users':
            loadUsers();
            break;
        case 'reports':
            renderResponseTimeChart();
            renderCategoryChart();
            break;
    }
}

/* ============================================
   DASHBOARD
============================================ */
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('adminToken');
        
        $('#statsContainer').html(`
            <div class="col-12 text-center py-5">
                <div class="loading-spinner mx-auto"></div>
            </div>
        `);

        // Sample stats data (replace with actual API call)
        const stats = {
            success: true,
            data: {
                total_requests: 15842,
                successful_requests: 15612,
                blocked_requests: 230,
                unique_users: 1245,
                requestsTrend: 12,
                successRateTrend: 3,
                blockedTrend: -5,
                successRate: 98.5,
                avgResponseTime: 45,
                activeDomains: 1245,
                activePolicies: 12
            }
        };

        if (stats.success) {
            renderStatsCards(stats.data);
        }

        // Sample traffic data
        const trafficData = {
            data: [320, 450, 380, 520, 610, 580, 720, 650, 590, 680, 750, 820],
            labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
        };
        renderTrafficChart(trafficData);

        // Sample status data
        const statusData = {
            data: [15612, 230, 85],
            labels: ['مجاز', 'مسدود', 'ناهنجاری']
        };
        renderStatusChart(statusData);

        // Sample top domains
        const domainsData = {
            data: [1250, 980, 750, 620, 450],
            labels: ['Google Scholar', 'PubMed', 'Sci-Hub', 'ResearchGate', 'IEEE']
        };
        renderTopDomainsChart(domainsData);

        // Sample top users
        const usersData = {
            data: [450, 380, 320, 290, 250],
            labels: ['علی محمدی', 'سارا احمدی', 'رضا کریمی', 'محمد حسینی', 'زهرا نادری']
        };
        renderTopUsersChart(usersData);

        loadRecentActivity();

    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('error', 'خطا', 'خطا در بارگذاری داده‌ها');
    }
}

function renderStatsCards(data) {
    const statsHtml = `
        <div class="stat-card slide-up">
            <div class="stat-header">
                <div class="stat-icon blue">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-trend up">
                    <i class="fas fa-arrow-up"></i>
                    ${data.requestsTrend || 0}%
                </div>
            </div>
            <div class="stat-value">${formatNumber(data.total_requests)}</div>
            <div class="stat-label">کل درخواست‌ها</div>
        </div>
        <div class="stat-card slide-up" style="animation-delay: 0.1s;">
            <div class="stat-header">
                <div class="stat-icon green">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-trend up">
                    <i class="fas fa-arrow-up"></i>
                    ${data.successRateTrend || 0}%
                </div>
            </div>
            <div class="stat-value">${formatNumber(data.successful_requests)}</div>
            <div class="stat-label">درخواست‌های موفق</div>
        </div>
        <div class="stat-card slide-up" style="animation-delay: 0.2s;">
            <div class="stat-header">
                <div class="stat-icon red">
                    <i class="fas fa-ban"></i>
                </div>
                <div class="stat-trend ${data.blockedTrend > 0 ? 'down' : 'up'}">
                    <i class="fas fa-arrow-${data.blockedTrend > 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(data.blockedTrend || 0)}%
                </div>
            </div>
            <div class="stat-value">${formatNumber(data.blocked_requests)}</div>
            <div class="stat-label">درخواست‌های مسدود</div>
        </div>
        <div class="stat-card slide-up" style="animation-delay: 0.3s;">
            <div class="stat-header">
                <div class="stat-icon orange">
                    <i class="fas fa-users"></i>
                </div>
            </div>
            <div class="stat-value">${formatNumber(data.unique_users)}</div>
            <div class="stat-label">کاربران فعال</div>
        </div>
    `;
    $('#statsContainer').html(statsHtml);

    $('#quickSuccessRate').text((data.successRate || 98.5) + '%');
    $('#quickAvgResponse').text((data.avgResponseTime || 45) + 'ms');
    $('#quickDomains').text(formatNumber(data.activeDomains || 1245));
    $('#quickPolicies').text(data.activePolicies || 12);
}

function renderTrafficChart(data) {
    if (trafficChart) trafficChart.destroy();

    trafficChart = new ApexCharts(document.querySelector("#trafficChart"), {
        series: [{
            name: 'درخواست‌ها',
            data: data.data
        }],
        chart: {
            type: 'area',
            height: 300,
            toolbar: { show: false },
            fontFamily: 'Vazirmatn, Tahoma, sans-serif',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        colors: ['#667eea', '#764ba2'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.2,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: data.labels,
            labels: {
                style: { colors: '#64748b' }
            }
        },
        yaxis: {
            labels: {
                style: { colors: '#64748b' }
            }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4
        },
        tooltip: {
            theme: 'light',
            y: { formatter: val => formatNumber(val) + ' درخواست' }
        }
    });
    trafficChart.render();
}

function renderStatusChart(data) {
    if (statusChart) statusChart.destroy();

    statusChart = new ApexCharts(document.querySelector("#statusChart"), {
        series: data.data,
        chart: {
            type: 'donut',
            height: 300,
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        labels: data.labels,
        colors: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
        legend: {
            position: 'bottom',
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: { show: true },
                        value: {
                            show: true,
                            formatter: val => formatNumber(parseInt(val))
                        },
                        total: {
                            show: true,
                            label: 'مجموع',
                            formatter: w => formatNumber(w.globals.seriesTotals.reduce((a, b) => a + b, 0))
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: val => Math.round(val) + '%'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { height: 250 },
                legend: { position: 'bottom' }
            }
        }]
    });
    statusChart.render();
}

function renderTopDomainsChart(data) {
    if (topDomainsChart) topDomainsChart.destroy();

    topDomainsChart = new ApexCharts(document.querySelector("#topDomainsChart"), {
        series: [{
            data: data.data
        }],
        chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false },
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                horizontal: true,
                distributed: true
            }
        },
        colors: ['#667eea', '#764ba2', '#00d2ff', '#f093fb', '#4facfe'],
        dataLabels: {
            enabled: true,
            formatter: val => formatNumber(val),
            offsetX: 30
        },
        xaxis: {
            categories: data.labels,
            labels: {
                style: { colors: '#64748b' },
                formatter: val => formatNumber(val)
            }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4
        }
    });
    topDomainsChart.render();
}

function renderTopUsersChart(data) {
    if (topUsersChart) topUsersChart.destroy();

    topUsersChart = new ApexCharts(document.querySelector("#topUsersChart"), {
        series: [{
            name: 'درخواست‌ها',
            data: data.data
        }],
        chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: false },
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '40%',
                endingShape: 'rounded'
            }
        },
        colors: ['#667eea'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.25,
                gradientToColors: ['#764ba2'],
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        xaxis: {
            categories: data.labels,
            labels: {
                style: { colors: '#64748b' }
            }
        },
        yaxis: {
            labels: {
                style: { colors: '#64748b' },
                formatter: val => formatNumber(val)
            }
        },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4
        },
        dataLabels: {
            enabled: true,
            formatter: val => formatNumber(val)
        }
    });
    topUsersChart.render();
}

function loadRecentActivity() {
    const activities = [
        { time: '۲ دقیقه پیش', user: 'علی محمدی', action: 'افزودن دامنه', details: 'scirp.org', ip: '10.0.0.1', status: 'success' },
        { time: '۵ دقیقه پیش', user: 'سارا احمدی', action: 'ویرایش سیاست', details: 'سیاست دسترسی شبانه', ip: '10.0.0.2', status: 'success' },
        { time: '۸ دقیقه پیش', user: 'رضا کریمی', action: 'مسدود کردن', details: 'example-banned.com', ip: '10.0.0.3', status: 'warning' },
        { time: '۱۲ دقیقه پیش', user: 'محمد حسینی', action: 'ورود', details: 'پنل مدیریت', ip: '10.0.0.4', status: 'success' },
        { time: '۱۵ دقیقه پیش', user: 'سیستم', action: 'تشخیص ناهنجاری', details: '۳ تلاش مشکوک', ip: '-', status: 'danger' }
    ];

    let html = '';
    activities.forEach(a => {
        const statusClass = a.status === 'success' ? 'badge-success' : 
                           a.status === 'warning' ? 'badge-warning' : 'badge-danger';
        html += `
            <tr>
                <td><small class="text-muted">${a.time}</small></td>
                <td>${a.user}</td>
                <td>${a.action}</td>
                <td><small>${a.details}</small></td>
                <td><small class="text-muted">${a.ip}</small></td>
                <td><span class="badge ${statusClass}">${a.status === 'success' ? 'موفق' : a.status === 'warning' ? 'هشدار' : 'خطا'}</span></td>
            </tr>
        `;
    });
    $('#recentActivityBody').html(html);
}

/* ============================================
   DOMAINS MANAGEMENT
============================================ */
async function loadDomains() {
    // Sample domains data
    const domains = [
        { id: 1, domain: 'scholar.google.com', name: 'Google Scholar', category: 'search', access_type: 'whitelist', request_count: 1250, is_active: true },
        { id: 2, domain: 'pubmed.ncbi.nlm.nih.gov', name: 'PubMed', category: 'database', access_type: 'whitelist', request_count: 980, is_active: true },
        { id: 3, domain: 'sci-hub.se', name: 'Sci-Hub', category: 'repository', access_type: 'graylist', request_count: 750, is_active: true },
        { id: 4, domain: 'researchgate.net', name: 'ResearchGate', category: 'academic', access_type: 'whitelist', request_count: 620, is_active: true },
        { id: 5, domain: 'ieeexplore.ieee.org', name: 'IEEE Xplore', category: 'database', access_type: 'whitelist', request_count: 450, is_active: true },
        { id: 6, domain: 'youtube.com', name: 'YouTube', category: 'other', access_type: 'blacklist', request_count: 320, is_active: false }
    ];

    if (domainsTable) {
        domainsTable.clear();
        domains.forEach(domain => {
            const accessClass = domain.access_type === 'whitelist' ? 'badge-success' : 
                               domain.access_type === 'blacklist' ? 'badge-danger' : 'badge-warning';
            const accessText = domain.access_type === 'whitelist' ? 'سفید' : 
                              domain.access_type === 'blacklist' ? 'سیاه' : 'خاکستری';
            const statusClass = domain.is_active ? 'badge-success' : 'badge-secondary';
            const statusText = domain.is_active ? 'فعال' : 'غیرفعال';

            domainsTable.row.add([
                `<input type="checkbox" data-id="${domain.id}">`,
                `<code>${domain.domain}</code>`,
                domain.name,
                getCategoryName(domain.category),
                `<span class="badge ${accessClass}">${accessText}</span>`,
                formatNumber(domain.request_count),
                `<span class="badge ${statusClass}">${statusText}</span>`,
                `
                    <button class="btn btn-sm btn-icon btn-secondary" onclick="viewDomain(${domain.id})" title="مشاهده">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-primary" onclick="editDomain(${domain.id})" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-danger" onclick="confirmDeleteDomain(${domain.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                `
            ]);
        });
        domainsTable.draw();
    }
}

function showAddDomainModal() {
    $('#addDomainForm')[0].reset();
    $('#addDomainModal').modal('show');
}

function addDomain() {
    const formData = new FormData(document.getElementById('addDomainForm'));
    const data = Object.fromEntries(formData);
    
    showToast('success', 'موفق', 'دامنه با موفقیت افزوده شد');
    $('#addDomainModal').modal('hide');
    loadDomains();
}

function editDomain(id) {
    showToast('info', 'ویرایش', 'در حال بارگذاری اطلاعات دامنه...');
    $('#editDomainModal').modal('show');
}

function updateDomain() {
    showToast('success', 'موفق', 'تغییرات ذخیره شد');
    $('#editDomainModal').modal('hide');
    loadDomains();
}

function confirmDeleteDomain(id) {
    deleteCallback = () => deleteDomain(id);
    $('#confirmDeleteModal').modal('show');
}

function deleteDomain(id) {
    showToast('success', 'موفق', 'دامنه حذف شد');
    loadDomains();
}

function exportDomains() {
    showToast('info', 'در حال آماده‌سازی', 'فایل خروجی در حال آماده‌سازی است...');
    setTimeout(() => {
        showToast('success', 'آماده شد', 'فایل Excel دانلود خواهد شد');
    }, 1500);
}

function importDomains() {
    $('#importCsvModal').modal('show');
}

function importCsvFile() {
    const fileInput = document.getElementById('csvFileInput');
    if (!fileInput.files[0]) {
        showToast('error', 'خطا', 'لطفاً فایل را انتخاب کنید');
        return;
    }
    
    showToast('success', 'موفق', 'دامنه‌ها با موفقیت وارد شدند');
    $('#importCsvModal').modal('hide');
    loadDomains();
}

function viewDomain(id) {
    showToast('info', 'مشاهده', 'در حال نمایش جزئیات دامنه...');
}

/* ============================================
   POLICIES MANAGEMENT
============================================ */
function loadPolicies() {
    const policies = [
        {
            id: 1,
            name: 'محدودیت شبانه',
            type: 'time',
            priority: 'high',
            description: 'مسدود کردن دسترسی بین ساعت ۱۰ شب تا ۷ صبح',
            is_active: true,
            rules: ['ساعت ۲۲:۰۰ تا ۰۷:۰۰', 'پلتفرم: همه']
        },
        {
            id: 2,
            name: 'بلاک سایت‌های غیرعلمی',
            type: 'category',
            priority: 'medium',
            description: 'مسدود کردن دسترسی به سایت‌های غیرمرتبط با تحقیقات',
            is_active: true,
            rules: ['دسته‌بندی: سرگرمی', 'دسته‌بندی: شبکه‌های اجتماعی']
        },
        {
            id: 3,
            name: 'محدودیت حجم دانلود',
            type: 'bandwidth',
            priority: 'low',
            description: 'محدود کردن حجم دانلود روزانه به ۵۰۰ مگابایت',
            is_active: false,
            rules: ['محدودیت: ۵۰۰ MB/روز', 'واحد: کاربر']
        }
    ];

    let html = '';
    policies.forEach(policy => {
        const priorityClass = policy.priority === 'high' ? 'badge-danger' : 
                             policy.priority === 'medium' ? 'badge-warning' : 'badge-success';
        const priorityText = policy.priority === 'high' ? 'بالا' : 
                            policy.priority === 'medium' ? 'متوسط' : 'پایین';
        const statusClass = policy.is_active ? 'badge-success' : 'badge-secondary';

        html += `
            <div class="policy-card ${policy.priority === 'high' ? 'danger' : policy.priority === 'medium' ? 'warning' : ''}">
                <div class="policy-header">
                    <div class="policy-title">
                        <div class="policy-icon">
                            <i class="fas fa-${getPolicyIcon(policy.type)}"></i>
                        </div>
                        <div>
                            <h6>${policy.name}</h6>
                            <p>${policy.description}</p>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <span class="badge ${priorityClass}">${priorityText}</span>
                        <span class="badge ${statusClass}">${policy.is_active ? 'فعال' : 'غیرفعال'}</span>
                    </div>
                </div>
                <div class="policy-body">
                    <p>${policy.description}</p>
                    <div class="policy-rules">
                        <h6><i class="fas fa-list-ul"></i> قوانین:</h6>
                        <ul>
                            ${policy.rules.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="mt-3 d-flex gap-2">
                    <button class="btn btn-sm btn-secondary" onclick="togglePolicy(${policy.id})">
                        <i class="fas fa-${policy.is_active ? 'pause' : 'play'}"></i>
                        ${policy.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editPolicy(${policy.id})">
                        <i class="fas fa-edit"></i> ویرایش
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeletePolicy(${policy.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
    });

    $('#policiesList').html(html || '<div class="empty-state"><div class="icon"><i class="fas fa-shield-alt"></i></div><h5>سیاستی یافت نشد</h5><p>برای شروع، یک سیاست جدید ایجاد کنید.</p></div>');
}

function showAddPolicyModal() {
    $('#addPolicyForm')[0].reset();
    $('#policyRulesContainer').html(`
        <div class="input-group mb-2">
            <input type="text" name="rules[]" class="form-control" placeholder="قانون ۱">
            <button type="button" class="btn btn-danger" onclick="removeRule(this)">
                <i class="fas fa-minus"></i>
            </button>
        </div>
    `);
    $('#addPolicyModal').modal('show');
}

function addRule() {
    const container = $('#policyRulesContainer');
    const index = container.children().length + 1;
    container.append(`
        <div class="input-group mb-2">
            <input type="text" name="rules[]" class="form-control" placeholder="قانون ${index}">
            <button type="button" class="btn btn-danger" onclick="removeRule(this)">
                <i class="fas fa-minus"></i>
            </button>
        </div>
    `);
}

function removeRule(btn) {
    $(btn).closest('.input-group').remove();
}

function addPolicy() {
    showToast('success', 'موفق', 'سیاست با موفقیت ایجاد شد');
    $('#addPolicyModal').modal('hide');
    loadPolicies();
}

function togglePolicy(id) {
    showToast('success', 'موفق', 'وضعیت سیاست تغییر کرد');
    loadPolicies();
}

function editPolicy(id) {
    showToast('info', 'ویرایش', 'در حال آماده‌سازی فرم ویرایش...');
}

function confirmDeletePolicy(id) {
    deleteCallback = () => deletePolicy(id);
    $('#confirmDeleteModal').modal('show');
}

function deletePolicy(id) {
    showToast('success', 'موفق', 'سیاست حذف شد');
    loadPolicies();
}

/* ============================================
   LOGS MANAGEMENT
============================================ */
function loadLogs() {
    const logs = [
        { id: 1, timestamp: new Date().toISOString(), username: 'علی محمدی', url: 'https://scholar.google.com/articles/123', method: 'GET', status: 'allow', response_time: 45, size: 256000, ip: '10.0.0.1', domain: 'scholar.google.com' },
        { id: 2, timestamp: new Date().toISOString(), username: 'سارا احمدی', url: 'https://pubmed.ncbi.nlm.nih.gov/123456', method: 'GET', status: 'allow', response_time: 78, size: 512000, ip: '10.0.0.2', domain: 'pubmed.ncbi.nlm.nih.gov' },
        { id: 3, timestamp: new Date().toISOString(), username: 'رضا کریمی', url: 'https://youtube.com/watch?v=123', method: 'GET', status: 'blocked', response_time: 12, size: 0, ip: '10.0.0.3', domain: 'youtube.com' },
        { id: 4, timestamp: new Date().toISOString(), username: 'محمد حسینی', url: 'https://sci-hub.se/10.1038/s41586-020-1234-5', method: 'GET', status: 'allow', response_time: 234, size: 1024000, ip: '10.0.0.4', domain: 'sci-hub.se' }
    ];

    if (logsTable) {
        logsTable.clear();
        logs.forEach(log => {
            const statusClass = log.status === 'allow' ? 'badge-success' : 
                               log.status === 'blocked' ? 'badge-danger' : 'badge-warning';
            const statusText = log.status === 'allow' ? 'مجاز' : 
                              log.status === 'blocked' ? 'مسدود' : 'ناهنجاری';

            logsTable.row.add([
                formatDateTime(log.timestamp),
                log.username,
                `<code class="small">${truncateUrl(log.url)}</code>`,
                `<span class="badge badge-info">${log.method || 'GET'}</span>`,
                `<span class="badge ${statusClass}">${statusText}</span>`,
                log.response_time ? `${log.response_time}ms` : '-',
                log.size ? formatBytes(log.size) : '-',
                log.ip,
                `
                    <button class="btn btn-sm btn-icon btn-secondary" onclick="viewLogDetails(${log.id})" title="جزئیات">
                        <i class="fas fa-search"></i>
                    </button>
                `
            ]);
        });
        logsTable.draw();
    }
}

function loadLiveLogs() {
    const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        username: 'کاربر جدید',
        url: 'https://example.com/search?q=test',
        method: 'GET',
        status: 'allow',
        response_time: 56,
        size: 128000,
        ip: '192.168.1.100'
    };
    
    const statusClass = newLog.status === 'allow' ? 'badge-success' : 
                       newLog.status === 'blocked' ? 'badge-danger' : 'badge-warning';
    const statusText = newLog.status === 'allow' ? 'مجاز' : 
                      newLog.status === 'blocked' ? 'مسدود' : 'ناهنجاری';
    
    const html = `
        <tr class="animate__animated animate__fadeIn">
            <td><small class="text-muted">${formatTime(newLog.timestamp)}</small></td>
            <td>${newLog.username}</td>
            <td><code class="small">${truncateUrl(newLog.url, 50)}</code></td>
            <td><span class="badge badge-info">${newLog.method}</span></td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>${newLog.response_time}ms</td>
            <td>${formatBytes(newLog.size)}</td>
            <td><code class="small">${newLog.ip}</code></td>
            <td>
                <button class="btn btn-sm btn-icon btn-secondary" onclick="viewLogDetails(${newLog.id})">
                    <i class="fas fa-search"></i>
                </button>
            </td>
        </tr>
    `;
    
    const tbody = $('#logsTableBody');
    tbody.prepend(html);
    while (tbody.children().length > 100) {
        tbody.children().last().remove();
    }
}

function toggleLiveLog() {
    isLiveLogActive = !isLiveLogActive;
    const icon = $('#liveLogIcon');
    const text = $('#liveLogText');
    const badge = $('#liveLogBadge');

    if (isLiveLogActive) {
        icon.removeClass('fa-play').addClass('fa-pause');
        text.text('توقف');
        badge.removeClass('badge-secondary').addClass('badge-success');
        badge.find('.dot').show();
    } else {
        icon.removeClass('fa-pause').addClass('fa-play');
        text.text('ادامه');
        badge.removeClass('badge-success').addClass('badge-secondary');
        badge.find('.dot').hide();
    }
}

function viewLogDetails(id) {
    $('#logDetailTime').text(formatDateTime(new Date().toISOString()));
    $('#logDetailUser').text('علی محمدی');
    $('#logDetailIp').text('10.0.0.1');
    $('#logDetailStatus').html('<span class="badge badge-success">مجاز</span>');
    $('#logDetailUrl').text('https://scholar.google.com/articles/123');
    $('#logDetailUserAgent').text('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    $('#viewLogModal').modal('show');
}

function exportLogs() {
    showToast('info', 'در حال آماده‌سازی', 'فایل خروجی در حال آماده‌سازی است...');
    setTimeout(() => {
        showToast('success', 'آماده شد', 'فایل CSV دانلود خواهد شد');
    }, 1500);
}

function clearFilters() {
    $('#logDateFrom').val('');
    $('#logDateTo').val('');
    $('#logStatusFilter').val('');
    $('#logSearchInput').val('');
    if (logsTable) logsTable.search('').draw();
}

/* ============================================
   ANOMALIES MANAGEMENT
============================================ */
function loadAnomalies() {
    const anomalies = [
        { id: 1, timestamp: new Date().toISOString(), type: 'high_request_rate', severity: 'critical', username: 'کاربر ناشناس', ip: '192.168.1.100', description: 'بیش از ۱۰۰۰ درخواست در ۵ دقیقه', status: 'pending' },
        { id: 2, timestamp: new Date().toISOString(), type: 'suspicious_url', severity: 'warning', username: 'test_user', ip: '10.0.0.5', description: 'تلاش برای دسترسی به URL مشکوک', status: 'investigating' },
        { id: 3, timestamp: new Date().toISOString(), type: 'unusual_hours', severity: 'info', username: 'normal_user', ip: '10.0.0.6', description: 'دسترسی در ساعت غیراداری', status: 'resolved' }
    ];

    $('#criticalAnomalies').text(1);
    $('#warningAnomalies').text(1);
    $('#infoAnomalies').text(1);
    $('#resolvedAnomalies').text(1);

    if (anomaliesTable) {
        anomaliesTable.clear();
        anomalies.forEach(anomaly => {
            const severityClass = anomaly.severity === 'critical' ? 'badge-danger' : 
                                 anomaly.severity === 'warning' ? 'badge-warning' : 'badge-info';
            const statusClass = anomaly.status === 'resolved' ? 'badge-success' : 
                               anomaly.status === 'ignored' ? 'badge-secondary' : 'badge-warning';

            anomaliesTable.row.add([
                formatDateTime(anomaly.timestamp),
                getAnomalyTypeName(anomaly.type),
                `<span class="badge ${severityClass}">${getSeverityText(anomaly.severity)}</span>`,
                anomaly.username,
                `<code>${anomaly.ip}</code>`,
                `<small>${anomaly.description}</small>`,
                `<span class="badge ${statusClass}">${getStatusText(anomaly.status)}</span>`,
                `
                    <button class="btn btn-sm btn-icon btn-success" onclick="resolveAnomaly(${anomaly.id})" title="علامت‌گذاری حل شده">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-secondary" onclick="ignoreAnomaly(${anomaly.id})" title="نادیده گرفتن">
                        <i class="fas fa-eye-slash"></i>
                    </button>
                `
            ]);
        });
        anomaliesTable.draw();
    }
}

function runAnomalyScan() {
    showToast('info', 'در حال اسکن', 'در حال بررسی الگوهای غیرعادی...');
    setTimeout(() => {
        showToast('success', 'اسکن کامل شد', '۲ ناهنجاری جدید یافت شد');
        loadAnomalies();
    }, 2000);
}

function resolveAnomaly(id) {
    showToast('success', 'موفق', 'ناهنجاری علامت‌گذاری شد');
    loadAnomalies();
}

function ignoreAnomaly(id) {
    showToast('success', 'موفق', 'ناهنجاری نادیده گرفته شد');
    loadAnomalies();
}

/* ============================================
   USERS MANAGEMENT
============================================ */
function loadUsers() {
    const users = [
        { id: 1, name: 'علی محمدی', email: 'ali@test.com', role: 'admin', lastActive: '۵ دقیقه پیش', is_active: true },
        { id: 2, name: 'سارا احمدی', email: 'sara@test.com', role: 'operator', lastActive: '۱ ساعت پیش', is_active: true },
        { id: 3, name: 'رضا کریمی', email: 'reza@test.com', role: 'user', lastActive: '۲ ساعت پیش', is_active: true },
        { id: 4, name: 'محمد حسینی', email: 'mohammad@test.com', role: 'user', lastActive: '۱ روز پیش', is_active: false }
    ];

    if (usersTable) {
        usersTable.clear();
        users.forEach(user => {
            const roleClass = user.role === 'admin' ? 'badge-danger' : 
                              user.role === 'operator' ? 'badge-warning' : 'badge-info';
            const roleText = user.role === 'admin' ? 'مدیر' : 
                            user.role === 'operator' ? 'اپراتور' : 'کاربر';
            const statusClass = user.is_active ? 'badge-success' : 'badge-secondary';

            usersTable.row.add([
                `
                    <div class="d-flex align-items-center gap-2">
                        <div class="user-avatar" style="width: 35px; height: 35px; font-size: 14px;">
                            ${user.name.charAt(0)}
                        </div>
                        <span>${user.name}</span>
                    </div>
                `,
                user.email,
                `<span class="badge ${roleClass}">${roleText}</span>`,
                user.lastActive,
                `<span class="badge ${statusClass}">${user.is_active ? 'فعال' : 'غیرفعال'}</span>`,
                `
                    <button class="btn btn-sm btn-icon btn-primary" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-danger" onclick="confirmDeleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                `
            ]);
        });
        usersTable.draw();
    }
}

function showAddUserModal() {
    $('#addUserForm')[0].reset();
    $('#addUserModal').modal('show');
}

function addUser() {
    showToast('success', 'موفق', 'کاربر با موفقیت افزوده شد');
    $('#addUserModal').modal('hide');
    loadUsers();
}

function editUser(id) {
    showToast('info', 'ویرایش', 'در حال آماده‌سازی فرم ویرایش...');
}

function confirmDeleteUser(id) {
    deleteCallback = () => deleteUser(id);
    $('#confirmDeleteModal').modal('show');
}

function deleteUser(id) {
    showToast('success', 'موفق', 'کاربر حذف شد');
    loadUsers();
}

/* ============================================
   REPORTS & CHARTS
============================================ */
function generateReport(type) {
    showToast('info', 'در حال تولید', 'گزارش در حال آماده‌سازی است...');
    
    setTimeout(() => {
        const reportNames = {
            traffic: 'گزارش ترافیک',
            security: 'گزارش امنیتی',
            user: 'گزارش کاربران'
        };
        showToast('success', 'آماده شد', `${reportNames[type]} با موفقیت تولید شد`);
        
        const link = document.createElement('a');
        link.download = `${type}_report_${new Date().toISOString().slice(0,10)}.pdf`;
        link.href = '#';
        link.click();
    }, 2000);
}

function renderResponseTimeChart() {
    if (responseTimeChart) responseTimeChart.destroy();
    
    responseTimeChart = new ApexCharts(document.querySelector("#responseTimeChart"), {
        series: [{
            name: 'زمان پاسخ (ms)',
            data: [45, 52, 38, 45, 42, 48, 35, 40, 44, 41, 39, 43]
        }],
        chart: {
            type: 'line',
            height: 300,
            toolbar: { show: false },
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        colors: ['#667eea'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.5,
                gradientToColors: ['#764ba2'],
                opacityFrom: 0.8,
                opacityTo: 0.2,
                stops: [0, 100]
            }
        },
        xaxis: {
            categories: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
                        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
            labels: { style: { colors: '#64748b' } }
        },
        yaxis: {
            labels: { style: { colors: '#64748b' } },
            title: { text: 'میلی‌ثانیه', style: { color: '#64748b' } }
        },
        tooltip: {
            y: { formatter: val => val + ' ms' }
        }
    });
    responseTimeChart.render();
}

function renderCategoryChart() {
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new ApexCharts(document.querySelector("#categoryChart"), {
        series: [45, 25, 15, 10, 5],
        chart: {
            type: 'donut',
            height: 300,
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        labels: ['پایگاه علمی', 'ژورنال', 'دیتابیس', 'ناشر', 'مخزن'],
        colors: ['#667eea', '#764ba2', '#00d2ff', '#f093fb', '#4facfe'],
        legend: {
            position: 'bottom',
            fontFamily: 'Vazirmatn, Tahoma, sans-serif'
        },
        dataLabels: {
            enabled: true,
            formatter: val => Math.round(val) + '%'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { height: 250 },
                legend: { position: 'bottom' }
            }
        }]
    });
    categoryChart.render();
}

/* ============================================
   SETTINGS & UTILITIES
============================================ */
function saveSetting(settingId, value) {
    console.log(`Saving ${settingId}: ${value}`);
    showToast('success', 'تنظیمات', 'تغییرات ذخیره شد');
}

function checkForUpdates() {
    showToast('info', 'بررسی بروزرسانی', 'در حال بررسی...');
    setTimeout(() => {
        showToast('success', 'بروزرسانی', 'سیستم به‌روز است');
    }, 1500);
}

function openSupportChat() {
    showToast('info', 'پشتیبانی', 'در حال اتصال به پشتیبانی...');
}

function changeTrafficPeriod(period) {
    showToast('info', 'تغییر بازه', `نمایش آمار ${period === 'day' ? 'روزانه' : period === 'week' ? 'هفتگی' : 'ماهانه'}`);
    loadDashboardData();
}

function refreshData() {
    showToast('info', 'بروزرسانی', 'در حال بروزرسانی داده‌ها...');
    loadPage(currentPage);
}

function exportDashboard() {
    showToast('info', 'در حال آماده‌سازی', 'خروجی PDF در حال آماده‌سازی است...');
    setTimeout(() => {
        showToast('success', 'آماده شد', 'فایل PDF دانلود خواهد شد');
    }, 2000);
}

function viewAllActivity() {
    navigateToPage('logs');
}

/* ============================================
   HELPER FUNCTIONS
============================================ */
function formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString('fa-IR');
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR');
}

function formatTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fa-IR');
}

function truncateUrl(url, maxLength = 60) {
    if (!url) return '-';
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

function getCategoryName(category) {
    const categories = {
        academic: 'پایگاه علمی',
        journal: 'ژورنال',
        database: 'دیتابیس',
        publisher: 'ناشر',
        repository: 'مخزن',
        search: 'موتور جستجو',
        other: 'سایر'
    };
    return categories[category] || category;
}

function getPolicyIcon(type) {
    const icons = {
        time: 'clock',
        bandwidth: 'tachometer-alt',
        category: 'folder',
        keyword: 'tag',
        ip: 'network-wired',
        user: 'user'
    };
    return icons[type] || 'shield-alt';
}

function getAnomalyTypeName(type) {
    const types = {
        high_request_rate: 'درخواست بالا',
        suspicious_url: 'URL مشکوک',
        unusual_hours: 'ساعت غیرعادی',
        bulk_download: 'دانلود انبوه',
        ip_rotation: 'تغییر IP',
        credential_sharing: 'اشتراک رمز',
        other: 'سایر'
    };
    return types[type] || type;
}

function getSeverityText(severity) {
    const severities = {
        critical: 'بحرانی',
        high: 'بالا',
        medium: 'متوسط',
        low: 'پایین',
        info: 'اطلاع'
    };
    return severities[severity] || severity;
}

function getStatusText(status) {
    const statuses = {
        pending: 'در انتظار',
        investigating: 'در حال بررسی',
        confirmed: 'تأیید شده',
        false_positive: 'مثبت کاذب',
        resolved: 'حل شده',
        ignored: 'نادیده گرفته'
    };
    return statuses[status] || status;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performGlobalSearch(query) {
    Swal.fire({
        title: 'نتایج جستجو',
        html: `
            <div class="list-group">
                <a href="#" class="list-group-item list-group-item-action" onclick="navigateToPage('domains')">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-globe"></i>
                            <strong>google scholar</strong>
                        </div>
                        <span class="badge badge-secondary">دامنه</span>
                    </div>
                    <small class="text-muted">scholar.google.com</small>
                </a>
                <a href="#" class="list-group-item list-group-item-action" onclick="navigateToPage('users')">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-user"></i>
                            <strong>علی محمدی</strong>
                        </div>
                        <span class="badge badge-secondary">کاربر</span>
                    </div>
                    <small class="text-muted">ali@test.com</small>
                </a>
            </div>
        `,
        width: '600px',
        showConfirmButton: true,
        confirmButtonText: 'بستن',
        customClass: {
            popup: 'text-right'
        }
    });
}

/* ============================================
   UI INTERACTIONS
============================================ */
function toggleSidebar() {
    const sidebar = $('#sidebar');
    sidebar.toggleClass('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.hasClass('collapsed'));
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        $('body').attr('data-theme', 'dark');
        $('#themeIcon').removeClass('fa-moon').addClass('fa-sun');
        localStorage.setItem('darkMode', 'true');
    } else {
        $('body').removeAttr('data-theme');
        $('#themeIcon').removeClass('fa-sun').addClass('fa-moon');
        localStorage.setItem('darkMode', 'false');
    }
}

function showUserMenu() {
    Swal.fire({
        title: 'پنل کاربری',
        html: `
            <div class="text-center">
                <div class="user-avatar mx-auto mb-3" style="width: 60px; height: 60px; font-size: 24px;">
                    آ
                </div>
                <h5>ادمین سیستم</h5>
                <p class="text-muted">مدیر ارشد</p>
                <hr>
                <button class="btn btn-sm btn-secondary w-100 mb-2" onclick="changePassword()">
                    <i class="fas fa-key"></i> تغییر رمز عبور
                </button>
                <button class="btn btn-sm btn-secondary w-100 mb-2" onclick="navigateToPage('settings'); Swal.close();">
                    <i class="fas fa-cog"></i> تنظیمات حساب
                </button>
                <button class="btn btn-sm btn-danger w-100" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> خروج
                </button>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: '350px'
    });
}

function changePassword() {
    Swal.fire({
        title: 'تغییر رمز عبور',
        html: `
            <input type="password" id="oldPassword" class="swal2-input" placeholder="رمز عبور فعلی">
            <input type="password" id="newPassword" class="swal2-input" placeholder="رمز عبور جدید">
            <input type="password" id="confirmPassword" class="swal2-input" placeholder="تکرار رمز عبور جدید">
        `,
        showCancelButton: true,
        confirmButtonText: 'تغییر',
        cancelButtonText: 'انصراف',
        preConfirm: () => {
            const oldPass = document.getElementById('oldPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;
            
            if (!oldPass || !newPass || !confirmPass) {
                Swal.showValidationMessage('لطفاً تمام فیلدها را پر کنید');
                return false;
            }
            if (newPass !== confirmPass) {
                Swal.showValidationMessage('رمز عبور جدید و تکرار آن مطابقت ندارند');
                return false;
            }
            if (newPass.length < 6) {
                Swal.showValidationMessage('رمز عبور باید حداقل ۶ کاراکتر باشد');
                return false;
            }
            return true;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            showToast('success', 'موفق', 'رمز عبور با موفقیت تغییر کرد');
        }
    });
}

function logout() {
    Swal.fire({
        title: 'خروج از سیستم',
        text: 'آیا از خروج خود اطمینان دارید؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'بله، خروج',
        cancelButtonText: 'انصراف'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminInfo');
            showToast('success', 'خروج', 'شما از سیستم خارج شدید');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
    });
}

/* ============================================
   TOAST NOTIFICATIONS
============================================ */
function showToast(type, title, message) {
    const toastContainer = $('#toastContainer');
    const toastId = 'toast_' + Date.now();
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toastHtml = `
        <div class="toast ${type}" id="${toastId}" style="display: flex;">
            <div class="icon">
                <i class="fas ${iconMap[type]}"></i>
            </div>
            <div class="toast-content">
                <h6>${title}</h6>
                <p>${message}</p>
            </div>
        </div>
    `;
    
    toastContainer.append(toastHtml);
    
    setTimeout(() => {
        $(`#${toastId}`).fadeOut(300, function() {
            $(this).remove();
        });
    }, 3000);
}

/* ============================================
   LOAD PREFERENCES
============================================ */
function loadPreferences() {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        $('#sidebar').addClass('collapsed');
    }
    
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        isDarkMode = true;
        $('body').attr('data-theme', 'dark');
        $('#themeIcon').removeClass('fa-moon').addClass('fa-sun');
    }
}

loadPreferences();

$('#confirmDeleteBtn').click(function() {
    if (deleteCallback) {
        deleteCallback();
        deleteCallback = null;
    }
    $('#confirmDeleteModal').modal('hide');
});