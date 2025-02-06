import React, { useState } from 'react'
import { createContext } from 'react'

interface TourContextValue {
  tourMode: boolean
  isMainTourOpen: boolean
  isGraphTourOpen: boolean
  isComparisonTourOpen: boolean
  isRequestSubtourOpen: boolean
  isMapSubtourOpen: boolean
  isGraphSubtourOpen: boolean
  isComparisonSubtourOpen: boolean
  mainTourStep: number
  graphTourStep: number
  comparisonTourStep: number
  setTourMode: React.Dispatch<React.SetStateAction<boolean>>
  setIsMainTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsGraphTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsComparisonTourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsRequestSubtourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsMapSubtourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsGraphSubtourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIsComparisonSubtourOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMainTourStep: React.Dispatch<React.SetStateAction<number>>
  setGraphTourStep: React.Dispatch<React.SetStateAction<number>>
  setComparisonTourStep: React.Dispatch<React.SetStateAction<number>>
}

export const TourContext = createContext<TourContextValue>({
  tourMode: false,
  isMainTourOpen: false,
  isGraphTourOpen: false,
  isComparisonTourOpen: false,
  isRequestSubtourOpen: false,
  isMapSubtourOpen: false,
  isGraphSubtourOpen: false,
  isComparisonSubtourOpen: false,
  mainTourStep: 0,
  graphTourStep: 0,
  comparisonTourStep: 0,
  setTourMode: () => {},
  setIsMainTourOpen: () => {},
  setIsGraphTourOpen: () => {},
  setIsComparisonTourOpen: () => {},
  setIsRequestSubtourOpen: () => {},
  setIsMapSubtourOpen: () => {},
  setIsGraphSubtourOpen: () => {},
  setIsComparisonSubtourOpen: () => {},
  setMainTourStep: () => {},
  setGraphTourStep: () => {},
  setComparisonTourStep: () => {},
})

export const TourProvider = ({ children }) => {
  const [tourMode, setTourMode] = useState(false)
  const [isMainTourOpen, setIsMainTourOpen] = useState(false)
  const [isGraphTourOpen, setIsGraphTourOpen] = useState(false)
  const [isComparisonTourOpen, setIsComparisonTourOpen] = useState(false)
  const [isRequestSubtourOpen, setIsRequestSubtourOpen] = useState(false)
  const [isMapSubtourOpen, setIsMapSubtourOpen] = useState(false)
  const [isGraphSubtourOpen, setIsGraphSubtourOpen] = useState(false)
  const [isComparisonSubtourOpen, setIsComparisonSubtourOpen] = useState(false)
  const [mainTourStep, setMainTourStep] = useState(0)
  const [graphTourStep, setGraphTourStep] = useState(0)
  const [comparisonTourStep, setComparisonTourStep] = useState(0)

  return (
    <TourContext.Provider
      value={{
        tourMode,
        setTourMode,
        isMainTourOpen,
        isGraphTourOpen,
        isComparisonTourOpen,
        isRequestSubtourOpen,
        isMapSubtourOpen,
        isGraphSubtourOpen,
        isComparisonSubtourOpen,
        mainTourStep,
        graphTourStep,
        comparisonTourStep,
        setIsMainTourOpen,
        setIsGraphTourOpen,
        setIsComparisonTourOpen,
        setIsRequestSubtourOpen,
        setIsMapSubtourOpen,
        setIsGraphSubtourOpen,
        setIsComparisonSubtourOpen,
        setMainTourStep,
        setGraphTourStep,
        setComparisonTourStep,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}
