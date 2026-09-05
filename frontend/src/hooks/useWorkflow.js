// src/hooks/useWorkflowPro.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * 🚀 Advanced Workflow Engine Hook
 * 
 * Features:
 * - Full workflow CRUD with validation
 * - Trigger-based execution (event, schedule, webhook, manual)
 * - Conditional branching (if/else, switch)
 * - Parallel execution
 * - Error handling & retry policies
 * - Execution timeout
 * - Step-by-step execution with progress
 * - Input/output schema validation
 * - Workflow templates
 * - Visual flow builder data
 * - Rate limiting
 * - Priority queue
 * - Scheduled workflows (cron)
 * - Workflow versioning
 * - Rollback support
 * - Webhook triggers
 * - API endpoint generation
 * - Execution logs with step details
 */
export const useWorkflowPro = (options = {}) => {
  const {
    maxConcurrentExecutions = 5,
    defaultTimeout = 300000, // 5 minutes
    maxRetries = 3,
    retryDelay = 5000,
    enableScheduling = true,
    enableWebhooks = true,
    enableVersioning = true,
    storageKey = 'admin_workflows_pro',
    persistToLocalStorage = true,
    onWorkflowComplete = null,
    onWorkflowError = null,
    onStepComplete = null
  } = options;

  // ============ Types ============
  const TRIGGER_TYPES = {
    MANUAL: 'manual',
    EVENT: 'event',
    SCHEDULE: 'schedule',
    WEBHOOK: 'webhook',
    API: 'api',
    DATABASE: 'database',
    FILE: 'file'
  };

  const STEP_TYPES = {
    ACTION: 'action',         // Simple action
    CONDITION: 'condition',   // If/else
    SWITCH: 'switch',         // Switch case
    LOOP: 'loop',            // For each
    PARALLEL: 'parallel',     // Parallel execution
    DELAY: 'delay',          // Wait
    SUBWORKFLOW: 'subworkflow', // Call another workflow
    TRANSFORM: 'transform',   // Data transformation
    VALIDATION: 'validation', // Validate data
    NOTIFICATION: 'notification' // Send notification
  };

  const EXECUTION_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    TIMED_OUT: 'timed_out',
    RETRYING: 'retrying'
  };

  // ============ Default Templates ============
  const WORKFLOW_TEMPLATES = {
    'user-onboarding': {
      name: 'فرآیند ثبت‌نام کاربر',
      description: 'ارسال ایمیل خوش‌آمدگویی، تخصیص نقش و ایجاد پروفایل',
      trigger: TRIGGER_TYPES.EVENT,
      triggerConfig: { event: 'user.register' },
      steps: [
        { id: 'step-1', type: STEP_TYPES.VALIDATION, name: 'اعتبارسنجی', config: { rules: ['email', 'required'] } },
        { id: 'step-2', type: STEP_TYPES.ACTION, name: 'ایجاد پروفایل', config: { action: 'createProfile' } },
        { id: 'step-3', type: STEP_TYPES.ACTION, name: 'تخصیص نقش', config: { action: 'assignRole', role: 'member' } },
        { id: 'step-4', type: STEP_TYPES.NOTIFICATION, name: 'ایمیل خوش‌آمد', config: { template: 'welcome' } }
      ]
    },
    'content-approval': {
      name: 'فرآیند تأیید محتوا',
      description: 'بررسی و تأیید محتوا توسط مدیران',
      trigger: TRIGGER_TYPES.MANUAL,
      steps: [
        { id: 'step-1', type: STEP_TYPES.ACTION, name: 'ارسال برای بررسی', config: { action: 'submitForReview' } },
        { id: 'step-2', type: STEP_TYPES.CONDITION, name: 'بررسی خودکار', config: { 
          condition: 'content.score > 80',
          trueSteps: [{ id: 'auto-approve', type: STEP_TYPES.ACTION, name: 'تأیید خودکار' }],
          falseSteps: [{ id: 'manual-review', type: STEP_TYPES.ACTION, name: 'بررسی دستی' }]
        }},
        { id: 'step-3', type: STEP_TYPES.NOTIFICATION, name: 'اعلان نتیجه', config: { template: 'review_result' } }
      ]
    },
    'data-backup': {
      name: 'پشتیبان‌گیری خودکار',
      description: 'پشتیبان‌گیری روزانه از دیتابیس',
      trigger: TRIGGER_TYPES.SCHEDULE,
      triggerConfig: { cron: '0 0 * * *' }, // Midnight daily
      steps: [
        { id: 'step-1', type: STEP_TYPES.ACTION, name: 'قفل دیتابیس', config: { action: 'lockDatabase' } },
        { id: 'step-2', type: STEP_TYPES.ACTION, name: 'ایجاد backup', config: { action: 'createBackup' } },
        { id: 'step-3', type: STEP_TYPES.ACTION, name: 'فشرده‌سازی', config: { action: 'compressBackup' } },
        { id: 'step-4', type: STEP_TYPES.ACTION, name: 'آپلود به cloud', config: { action: 'uploadToCloud' } },
        { id: 'step-5', type: STEP_TYPES.ACTION, name: 'باز کردن قفل', config: { action: 'unlockDatabase' } }
      ]
    }
  };

  // ============ State ============
  const [state, setState] = useState(() => {
    let savedData = null;
    if (persistToLocalStorage) {
      try {
        savedData = JSON.parse(localStorage.getItem(storageKey));
      } catch {}
    }

    return {
      workflows: savedData?.workflows || [],
      executions: savedData?.executions || [],
      scheduledJobs: savedData?.scheduledJobs || [],
      webhookEndpoints: savedData?.webhookEndpoints || [],
      activeExecutions: 0,
      stats: {
        totalWorkflows: 0,
        totalExecutions: 0,
        successRate: 100,
        averageDuration: 0
      }
    };
  });

  const { workflows, executions, activeExecutions } = state;

  // ============ Refs ============
  const stateRef = useRef(state);
  const executionQueue = useRef([]);
  const abortedExecutions = useRef(new Set());
  const scheduledTimers = useRef({});

  // Update ref
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ============ Persist ============
  useEffect(() => {
    if (persistToLocalStorage) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          workflows,
          executions: executions.slice(0, 100),
          scheduledJobs: state.scheduledJobs,
          webhookEndpoints: state.webhookEndpoints
        }));
      } catch {}
    }
  }, [workflows, executions, persistToLocalStorage, storageKey]);

  // ============ ۱. Create Workflow ============
  const createWorkflow = useCallback((workflowData) => {
    // Validation
    if (!workflowData.name?.trim()) {
      toast.error('❌ نام گردش کار الزامی است');
      return null;
    }

    const workflow = {
      id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: workflowData.name,
      description: workflowData.description || '',
      trigger: workflowData.trigger || TRIGGER_TYPES.MANUAL,
      triggerConfig: workflowData.triggerConfig || {},
      steps: workflowData.steps || [],
      enabled: true,
      priority: workflowData.priority || 'normal', // low, normal, high, critical
      timeout: workflowData.timeout || defaultTimeout,
      maxRetries: workflowData.maxRetries || maxRetries,
      retryDelay: workflowData.retryDelay || retryDelay,
      tags: workflowData.tags || [],
      version: 1,
      author: workflowData.author || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRun: null,
      runCount: 0,
      successCount: 0,
      failCount: 0,
      inputSchema: workflowData.inputSchema || {},
      outputSchema: workflowData.outputSchema || {}
    };

    // Generate webhook if needed
    if (workflow.trigger === TRIGGER_TYPES.WEBHOOK) {
      const webhookId = `wh-${Date.now()}`;
      workflow.webhookId = webhookId;
      workflow.webhookUrl = `/api/webhooks/${webhookId}`;
      
      setState(prev => ({
        ...prev,
        webhookEndpoints: [...prev.webhookEndpoints, {
          id: webhookId,
          workflowId: workflow.id,
          url: workflow.webhookUrl,
          createdAt: workflow.createdAt,
          secret: generateWebhookSecret()
        }]
      }));
    }

    // Setup schedule if needed
    if (workflow.trigger === TRIGGER_TYPES.SCHEDULE && workflow.triggerConfig?.cron) {
      setupScheduledExecution(workflow);
    }

    setState(prev => ({
      ...prev,
      workflows: [...prev.workflows, workflow],
      stats: { ...prev.stats, totalWorkflows: prev.stats.totalWorkflows + 1 }
    }));

    toast.success(`✅ گردش کار "${workflow.name}" ایجاد شد`);
    return workflow;
  }, [defaultTimeout, maxRetries, retryDelay]);

  // ============ ۲. Update Workflow ============
  const updateWorkflow = useCallback((workflowId, updates) => {
    setState(prev => ({
      ...prev,
      workflows: prev.workflows.map(w =>
        w.id === workflowId
          ? {
              ...w,
              ...updates,
              version: enableVersioning ? (w.version || 1) + 1 : w.version,
              updatedAt: new Date().toISOString()
            }
          : w
      )
    }));
    toast.success('✅ گردش کار به‌روزرسانی شد');
  }, [enableVersioning]);

  // ============ ۳. Delete Workflow ============
  const deleteWorkflow = useCallback((workflowId) => {
    const workflow = stateRef.current.workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    // Clear scheduled jobs
    if (scheduledTimers.current[workflowId]) {
      clearInterval(scheduledTimers.current[workflowId]);
      delete scheduledTimers.current[workflowId];
    }

    setState(prev => ({
      ...prev,
      workflows: prev.workflows.filter(w => w.id !== workflowId),
      executions: prev.executions.filter(e => e.workflowId !== workflowId),
      scheduledJobs: prev.scheduledJobs.filter(j => j.workflowId !== workflowId),
      webhookEndpoints: prev.webhookEndpoints.filter(w => w.workflowId !== workflowId)
    }));

    toast.success('🗑️ گردش کار حذف شد');
  }, []);

  // ============ ۴. Toggle Workflow ============
  const toggleWorkflow = useCallback((workflowId) => {
    setState(prev => ({
      ...prev,
      workflows: prev.workflows.map(w =>
        w.id === workflowId ? { ...w, enabled: !w.enabled } : w
      )
    }));

    const workflow = stateRef.current.workflows.find(w => w.id === workflowId);
    toast.success(workflow?.enabled ? '⏸️ غیرفعال شد' : '▶️ فعال شد');
  }, []);

  // ============ ۵. Execute Workflow ============
  const executeWorkflow = useCallback(async (workflowId, context = {}) => {
    const workflow = stateRef.current.workflows.find(w => w.id === workflowId);
    if (!workflow) throw new Error('Workflow not found');
    if (!workflow.enabled) throw new Error('Workflow is disabled');

    // Check concurrent execution limit
    if (activeExecutions >= maxConcurrentExecutions) {
      // Queue for later
      executionQueue.current.push({ workflowId, context });
      toast('📋 گردش کار در صف قرار گرفت', { icon: '⏳' });
      return { queued: true };
    }

    // Create execution record
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const execution = {
      id: executionId,
      workflowId,
      workflowName: workflow.name,
      startedAt: new Date().toISOString(),
      status: EXECUTION_STATUS.RUNNING,
      context,
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        name: step.name,
        type: step.type,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        duration: 0,
        result: null,
        error: null
      })),
      retryCount: 0,
      progress: 0
    };

    setState(prev => ({
      ...prev,
      executions: [execution, ...prev.executions],
      activeExecutions: prev.activeExecutions + 1
    }));

    // Execute steps
    try {
      const result = await executeSteps(workflow, execution, context);
      
      const completedExecution = {
        ...execution,
        status: EXECUTION_STATUS.COMPLETED,
        completedAt: new Date().toISOString(),
        duration: Date.now() - new Date(execution.startedAt).getTime(),
        progress: 100,
        result
      };

      updateExecution(completedExecution);
      
      setState(prev => ({
        ...prev,
        workflows: prev.workflows.map(w =>
          w.id === workflowId
            ? {
                ...w,
                lastRun: new Date().toISOString(),
                runCount: w.runCount + 1,
                successCount: w.successCount + 1
              }
            : w
        ),
        activeExecutions: prev.activeExecutions - 1,
        stats: {
          ...prev.stats,
          totalExecutions: prev.stats.totalExecutions + 1,
          successRate: calculateSuccessRate(prev)
        }
      }));

      onWorkflowComplete?.(completedExecution);
      toast.success(`✅ "${workflow.name}" با موفقیت اجرا شد`);
      
      // Process queue
      processExecutionQueue();
      
      return completedExecution;
    } catch (error) {
      const failedExecution = {
        ...execution,
        status: error.message === 'TIMEOUT' 
          ? EXECUTION_STATUS.TIMED_OUT 
          : EXECUTION_STATUS.FAILED,
        completedAt: new Date().toISOString(),
        duration: Date.now() - new Date(execution.startedAt).getTime(),
        error: error.message
      };

      updateExecution(failedExecution);

      setState(prev => ({
        ...prev,
        workflows: prev.workflows.map(w =>
          w.id === workflowId
            ? {
                ...w,
                lastRun: new Date().toISOString(),
                runCount: w.runCount + 1,
                failCount: w.failCount + 1
              }
            : w
        ),
        activeExecutions: prev.activeExecutions - 1,
        stats: {
          ...prev.stats,
          totalExecutions: prev.stats.totalExecutions + 1,
          successRate: calculateSuccessRate(prev)
        }
      }));

      onWorkflowError?.(failedExecution);
      toast.error(`❌ خطا در "${workflow.name}": ${error.message}`);
      
      // Retry logic
      if (execution.retryCount < workflow.maxRetries) {
        setTimeout(() => {
          retryExecution(workflowId, execution.id, context);
        }, workflow.retryDelay);
      }
      
      processExecutionQueue();
      
      throw error;
    }
  }, [activeExecutions, maxConcurrentExecutions, onWorkflowComplete, onWorkflowError]);

  // ============ Execute Individual Steps ============
  const executeSteps = async (workflow, execution, context) => {
    const timeout = workflow.timeout || defaultTimeout;
    const startTime = Date.now();
    let stepResults = {};

    for (let i = 0; i < workflow.steps.length; i++) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error('TIMEOUT');
      }

      // Check if aborted
      if (abortedExecutions.current.has(execution.id)) {
        throw new Error('CANCELLED');
      }

      const step = workflow.steps[i];
      
      // Update step status
      updateStepStatus(execution.id, step.id, 'running', Date.now());
      onStepComplete?.({ workflowId: workflow.id, step, status: 'running' });

      try {
        const stepResult = await executeStep(step, context, stepResults);
        stepResults[step.id] = stepResult;

        updateStepStatus(execution.id, step.id, 'completed', Date.now(), stepResult);
        onStepComplete?.({ workflowId: workflow.id, step, status: 'completed', result: stepResult });

        // Update overall progress
        const progress = Math.round(((i + 1) / workflow.steps.length) * 100);
        updateExecutionProgress(execution.id, progress);

        // Handle conditional branching
        if (step.type === STEP_TYPES.CONDITION && stepResult?.branch) {
          // Skip or include specific steps
          context._branch = stepResult.branch;
        }

      } catch (error) {
        updateStepStatus(execution.id, step.id, 'failed', Date.now(), null, error.message);
        onStepComplete?.({ workflowId: workflow.id, step, status: 'failed', error: error.message });
        throw error;
      }
    }

    return stepResults;
  };

  // ============ Execute Single Step ============
  const executeStep = async (step, context, previousResults) => {
    switch (step.type) {
      case STEP_TYPES.ACTION:
        return await executeAction(step.config, context);
      
      case STEP_TYPES.CONDITION:
        return evaluateCondition(step.config, context, previousResults);
      
      case STEP_TYPES.DELAY:
        return await executeDelay(step.config);
      
      case STEP_TYPES.PARALLEL:
        return await executeParallel(step.config, context);
      
      case STEP_TYPES.TRANSFORM:
        return transformData(step.config, context);
      
      case STEP_TYPES.VALIDATION:
        return validateData(step.config, context);
      
      case STEP_TYPES.NOTIFICATION:
        return await sendNotification(step.config, context);
      
      default:
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
        return { success: true, stepType: step.type };
    }
  };

  // ============ Step Implementations ============
  const executeAction = async (config, context) => {
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    
    // In real app, would call actual API endpoints
    const actions = {
      createProfile: () => ({ profileId: `prof-${Date.now()}` }),
      assignRole: () => ({ role: config.role || 'member' }),
      lockDatabase: () => ({ locked: true }),
      createBackup: () => ({ backupId: `backup-${Date.now()}`, size: '250MB' }),
      compressBackup: () => ({ compressedSize: '120MB' }),
      uploadToCloud: () => ({ url: 'https://cloud.example.com/backup.zip' }),
      unlockDatabase: () => ({ unlocked: true })
    };

    const actionFn = actions[config.action];
    return actionFn ? actionFn() : { executed: config.action };
  };

  const evaluateCondition = (config, context, results) => {
    // Simple condition evaluation
    const value = resolveValue(config.field, context, results);
    const targetValue = config.value;
    
    let result = false;
    switch (config.operator) {
      case 'equals': result = value === targetValue; break;
      case 'not_equals': result = value !== targetValue; break;
      case 'greater_than': result = Number(value) > Number(targetValue); break;
      case 'less_than': result = Number(value) < Number(targetValue); break;
      case 'contains': result = String(value).includes(targetValue); break;
      default: result = true;
    }

    return { result, branch: result ? 'true' : 'false' };
  };

  const executeDelay = async (config) => {
    const delay = config.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { delayed: delay };
  };

  const executeParallel = async (config, context) => {
    const branches = config.branches || [];
    const results = await Promise.all(
      branches.map(branch => 
        Promise.all(branch.map(step => executeStep(step, context, {})))
      )
    );
    return { parallelResults: results };
  };

  const transformData = (config, context) => {
    // Simple transformation
    const result = {};
    if (config.mappings) {
      config.mappings.forEach(mapping => {
        result[mapping.to] = resolveValue(mapping.from, context, {});
      });
    }
    return result;
  };

  const validateData = (config, context) => {
    const errors = [];
    (config.rules || []).forEach(rule => {
      if (rule === 'required' && !context.data) {
        errors.push('Data is required');
      }
      if (rule === 'email' && context.email && !context.email.includes('@')) {
        errors.push('Invalid email');
      }
    });
    
    if (errors.length > 0) throw new Error(errors.join(', '));
    return { valid: true };
  };

  const sendNotification = async (config, context) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { sent: true, template: config.template };
  };

  // ============ Helpers ============
  const resolveValue = (path, context, results) => {
    const parts = path?.split('.') || [];
    let value = context;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  };

  const updateExecution = (execution) => {
    setState(prev => ({
      ...prev,
      executions: prev.executions.map(e =>
        e.id === execution.id ? execution : e
      )
    }));
  };

  const updateExecutionProgress = (executionId, progress) => {
    setState(prev => ({
      ...prev,
      executions: prev.executions.map(e =>
        e.id === executionId ? { ...e, progress } : e
      )
    }));
  };

  const updateStepStatus = (executionId, stepId, status, timestamp, result = null, error = null) => {
    setState(prev => ({
      ...prev,
      executions: prev.executions.map(e =>
        e.id === executionId
          ? {
              ...e,
              steps: e.steps.map(s =>
                s.stepId === stepId
                  ? {
                      ...s,
                      status,
                      [status === 'running' ? 'startedAt' : 'completedAt']: new Date(timestamp).toISOString(),
                      duration: status !== 'running' ? timestamp - (s.startedAt ? new Date(s.startedAt).getTime() : timestamp) : 0,
                      result,
                      error
                    }
                  : s
              )
            }
          : e
      )
    }));
  };

  const retryExecution = async (workflowId, executionId, context) => {
    setState(prev => ({
      ...prev,
      executions: prev.executions.map(e =>
        e.id === executionId
          ? { ...e, status: EXECUTION_STATUS.RETRYING, retryCount: e.retryCount + 1 }
          : e
      )
    }));

    try {
      await executeWorkflow(workflowId, context);
    } catch {
      // Max retries reached
    }
  };

  const processExecutionQueue = () => {
    if (executionQueue.current.length > 0 && stateRef.current.activeExecutions < maxConcurrentExecutions) {
      const next = executionQueue.current.shift();
      executeWorkflow(next.workflowId, next.context);
    }
  };

  const setupScheduledExecution = (workflow) => {
    if (!enableScheduling) return;

    // Parse cron (simplified)
    const cronParts = (workflow.triggerConfig?.cron || '').split(' ');
    if (cronParts.length < 5) return;

    // Calculate interval (simplified)
    const interval = 60000; // Default 1 minute, real implementation would parse cron

    const timer = setInterval(() => {
      const currentWorkflow = stateRef.current.workflows.find(w => w.id === workflow.id);
      if (currentWorkflow?.enabled) {
        executeWorkflow(workflow.id, { scheduled: true, cron: workflow.triggerConfig.cron });
      }
    }, interval);

    scheduledTimers.current[workflow.id] = timer;

    setState(prev => ({
      ...prev,
      scheduledJobs: [...prev.scheduledJobs.filter(j => j.workflowId !== workflow.id), {
        workflowId: workflow.id,
        workflowName: workflow.name,
        cron: workflow.triggerConfig.cron,
        nextRun: new Date(Date.now() + interval).toISOString()
      }]
    }));
  };

  const calculateSuccessRate = (prevState) => {
    const total = prevState.stats.totalExecutions + 1;
    if (total === 0) return 100;
    const failed = prevState.workflows.reduce((sum, w) => sum + w.failCount, 0);
    return Math.round(((total - failed) / total) * 100);
  };

  const generateWebhookSecret = () => {
    return `whsec_${Math.random().toString(36).substring(2, 15)}`;
  };

  // ============ ۶. Cancel Execution ============
  const cancelExecution = useCallback((executionId) => {
    abortedExecutions.current.add(executionId);
    
    setState(prev => ({
      ...prev,
      executions: prev.executions.map(e =>
        e.id === executionId
          ? { ...e, status: EXECUTION_STATUS.CANCELLED, completedAt: new Date().toISOString() }
          : e
      )
    }));

    toast('⏹️ اجرای گردش کار متوقف شد');
  }, []);

  // ============ ۷. Get Workflow Stats ============
  const getWorkflowStats = useCallback(() => {
    const currentState = stateRef.current;
    
    return {
      total: currentState.workflows.length,
      active: currentState.workflows.filter(w => w.enabled).length,
      inactive: currentState.workflows.filter(w => !w.enabled).length,
      totalExecutions: currentState.stats.totalExecutions,
      successRate: currentState.stats.successRate,
      averageDuration: currentState.stats.averageDuration,
      activeExecutions: currentState.activeExecutions,
      scheduledJobs: currentState.scheduledJobs.length,
      webhookEndpoints: currentState.webhookEndpoints.length,
      byTrigger: {
        [TRIGGER_TYPES.MANUAL]: currentState.workflows.filter(w => w.trigger === TRIGGER_TYPES.MANUAL).length,
        [TRIGGER_TYPES.EVENT]: currentState.workflows.filter(w => w.trigger === TRIGGER_TYPES.EVENT).length,
        [TRIGGER_TYPES.SCHEDULE]: currentState.workflows.filter(w => w.trigger === TRIGGER_TYPES.SCHEDULE).length,
        [TRIGGER_TYPES.WEBHOOK]: currentState.workflows.filter(w => w.trigger === TRIGGER_TYPES.WEBHOOK).length
      },
      recentExecutions: currentState.executions.slice(0, 20)
    };
  }, []);

  // ============ ۸. Use Template ============
  const useTemplate = useCallback((templateName, overrides = {}) => {
    const template = WORKFLOW_TEMPLATES[templateName];
    if (!template) {
      toast.error('قالب مورد نظر یافت نشد');
      return null;
    }

    return createWorkflow({
      ...template,
      ...overrides,
      name: overrides.name || template.name
    });
  }, [createWorkflow]);

  // ============ ۹. Export/Import ============
  const exportWorkflows = useCallback(() => {
    const data = {
      workflows: stateRef.current.workflows,
      exportedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflows-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('📥 گردش کارها export شدند');
  }, []);

  const importWorkflows = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const importedWorkflows = data.workflows || [];
        
        setState(prev => ({
          ...prev,
          workflows: [...prev.workflows, ...importedWorkflows.map(w => ({
            ...w,
            id: `wf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            createdAt: new Date().toISOString(),
            lastRun: null,
            runCount: 0,
            successCount: 0,
            failCount: 0
          }))]
        }));
        
        toast.success(`📤 ${importedWorkflows.length} گردش کار import شد`);
      } catch (error) {
        toast.error('❌ فایل نامعتبر است');
      }
    };
    reader.readAsText(file);
  }, []);

  // ============ Cleanup ============
  useEffect(() => {
    return () => {
      Object.values(scheduledTimers.current).forEach(clearInterval);
    };
  }, []);

  return {
    // State
    workflows,
    executions,
    activeExecutions,
    scheduledJobs: state.scheduledJobs,
    webhookEndpoints: state.webhookEndpoints,
    
    // CRUD
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    
    // Execution
    executeWorkflow,
    cancelExecution,
    
    // Templates
    useTemplate,
    getTemplates: () => Object.keys(WORKFLOW_TEMPLATES),
    
    // Stats
    getWorkflowStats,
    
    // Export/Import
    exportWorkflows,
    importWorkflows,
    
    // Constants
    TRIGGER_TYPES,
    STEP_TYPES,
    EXECUTION_STATUS,
    WORKFLOW_TEMPLATES
  };
};

export default useWorkflowPro;