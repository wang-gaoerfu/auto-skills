import { registerTool } from './executor'
import { textTools } from './text-tools'
import { dataConversionTools } from './data-conversion-tools'
import { devTools } from './dev-tools'

// Register all tools
export function registerAllTools() {
  // Text processing tools
  textTools.forEach(tool => registerTool(tool))

  // Data conversion tools
  dataConversionTools.forEach(tool => registerTool(tool))

  // Developer tools
  devTools.forEach(tool => registerTool(tool))
}

// Export all tool categories
export { textTools } from './text-tools'
export { dataConversionTools } from './data-conversion-tools'
export { devTools } from './dev-tools'
export { registerTool, executeTool, getAllTools, getTool } from './executor'
