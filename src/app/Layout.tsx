import React from 'react'
import { Header } from '../components/Header'
import { StepNavigation } from '../components/StepNavigation'
import { useApp } from './useApp'
import { SettingsPage } from '../features/settings/SettingsPage'
import { UploadPage } from '../features/upload/UploadPage'
import { AnalyzingPage } from '../features/analyzing/AnalyzingPage'
import { ReviewPage } from '../features/review/ReviewPage'
import { ImageSelectionPage } from '../features/images/ImageSelectionPage'
import { TemplateSelectionPage } from '../features/templates/TemplateSelectionPage'
import { PrintPreviewPage } from '../features/preview/PrintPreviewPage'

export const Layout: React.FC = () => {
  const { currentRoute } = useApp()

  const renderPage = () => {
    switch (currentRoute) {
      case 'settings':
        return <SettingsPage />
      case 'upload':
        return <UploadPage />
      case 'analyzing':
        return <AnalyzingPage />
      case 'review':
        return <ReviewPage />
      case 'images':
        return <ImageSelectionPage />
      case 'templates':
        return <TemplateSelectionPage />
      case 'preview':
        return <PrintPreviewPage />
      default:
        return <UploadPage />
    }
  }

  return (
    <div>
      <Header />
      {currentRoute !== 'settings' && <StepNavigation />}
      <main className="main-content" role="main">
        {renderPage()}
      </main>
    </div>
  )
}
