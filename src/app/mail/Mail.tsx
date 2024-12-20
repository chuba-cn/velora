import React from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { TooltipProvider } from '@radix-ui/react-tooltip'

const Mail = () => {
  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction='horizontal'
        onLayout={ (sizes) => {
          console.log(sizes)
        } }
      >
        
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}

export default Mail