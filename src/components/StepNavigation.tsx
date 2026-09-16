import React from 'react'
import { useApp, WORKFLOW_STEPS, ROUTE_METAS, type AppRoute } from '../app/index'

export const StepNavigation: React.FC = () => {
  const { currentRoute, navigate } = useApp()

  const currentStepIndex = WORKFLOW_STEPS.indexOf(currentRoute)

  return (
    <nav className="steps-nav" aria-label="學習單製作流程">
      <ol className="steps-list">
        {WORKFLOW_STEPS.map((step, index) => {
          const meta = ROUTE_METAS[step]
          const isCurrent = currentRoute === step
          const isCompleted = currentStepIndex > -1 && index < currentStepIndex

          let statusClass = ''
          if (isCurrent) statusClass = 'active'
          else if (isCompleted) statusClass = 'completed'

          return (
            <React.Fragment key={step}>
              <li className="step-item">
                <button
                  type="button"
                  className={`step-btn ${statusClass}`}
                  onClick={() => navigate(step as AppRoute)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`第 ${meta.stepNumber} 步：${meta.title}`}
                >
                  <span className="step-badge" aria-hidden="true">
                    {isCompleted ? '✓' : meta.stepNumber}
                  </span>
                  <span>{meta.title}</span>
                </button>
              </li>
              {index < WORKFLOW_STEPS.length - 1 && (
                <li className="step-divider" aria-hidden="true">
                  →
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
