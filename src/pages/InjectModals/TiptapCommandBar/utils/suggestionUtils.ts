import { CommandOption, CommandParam, ParamType } from './commandData';
import { SuggestionType } from '../store/tiptapStore';
import { validateParamValue } from './validateParamValue';

/**
 * Configuration mapping parameter types to suggestion types
 * Add new parameter types here with their corresponding suggestion types
 */
export const PARAM_SUGGESTION_MAPPING: Record<ParamType, SuggestionType | null> = {
  // Parameters that need suggestion boxes
  [ParamType.Token]: SuggestionType.Token,
  [ParamType.Address]: SuggestionType.Address,
  [ParamType.Text]: SuggestionType.Address, // Using Address as fallback for Text

  // Parameters that don't need suggestion boxes
  [ParamType.Amount]: null,

  // When adding a new parameter type, add it here with its corresponding suggestion type
  // For example: [ParamType.NewType]: SuggestionType.NewType,
};

/**
 * Checks if a parameter type needs a suggestion box
 */
export function parameterNeedsSuggestion(paramType: ParamType): boolean {
  return PARAM_SUGGESTION_MAPPING[paramType] !== null;
}

/**
 * Gets the suggestion type for a parameter type
 * Returns null if the parameter doesn't need a suggestion
 */
export function getSuggestionTypeForParam(paramType: ParamType): SuggestionType | null {
  return PARAM_SUGGESTION_MAPPING[paramType];
}

/**
 * Gets the suggestion type for a parameter
 * Helper that combines parameterNeedsSuggestion and getSuggestionTypeForParam
 */
export function getSuggestionTypeForParamObject(param: CommandParam): SuggestionType | null {
  return parameterNeedsSuggestion(param.type) ? getSuggestionTypeForParam(param.type) : null;
}

/**
 * Finds the first parameter in a command that needs a suggestion box
 */
export function findFirstParamNeedingSuggestion(command: CommandOption): CommandParam | null {
  return command.params.find(param => parameterNeedsSuggestion(param.type)) || null;
}

/**
 * Checks if a parameter has a valid value
 */
export function hasValidParamValue(paramValue: any, paramType: ParamType): boolean {
  if (paramValue === undefined || paramValue === null || paramValue === '') {
    return false;
  }

  if (typeof paramValue === 'string' && paramValue.trim() === '') {
    return false;
  }

  return validateParamValue(paramValue, paramType);
}

/**
 * Finds the first unfilled parameter in a command that needs a suggestion box
 */
export function findFirstUnfilledParamNeedingSuggestion(
  command: CommandOption,
  parameters: Record<string, any>
): CommandParam | null {
  // Check if parameters object is empty
  const isEmptyParameters = !parameters || Object.keys(parameters).length === 0;

  // Check if all parameter values are empty
  const allParamsEmpty =
    isEmptyParameters ||
    Object.entries(parameters).every(([_, value]) => !value || value.trim() === '');

  // Function to find a parameter based on priority rules
  const findParamByPriority = (params: CommandParam[]): CommandParam | null => {
    if (params.length === 0) return null;

    // Find first unfilled parameter that needs suggestion
    for (const param of params) {
      const paramValue = parameters[param.id];
      const paramNeedsFilling = !hasValidParamValue(paramValue, param.type);

      if (paramNeedsFilling && parameterNeedsSuggestion(param.type)) {
        return param;
      }
    }

    return null;
  };

  // Filter parameters that need suggestion
  const requiredParamsNeedingSuggestion = command.params.filter(
    param => param.required && parameterNeedsSuggestion(param.type)
  );

  // Special case: command just confirmed with all empty parameters
  if (allParamsEmpty && requiredParamsNeedingSuggestion.length > 0) {
    return requiredParamsNeedingSuggestion[0];
  }

  // First check required parameters
  const firstUnfilledRequiredParam = findParamByPriority(requiredParamsNeedingSuggestion);
  if (firstUnfilledRequiredParam) {
    return firstUnfilledRequiredParam;
  }

  // If all required parameters are filled, check optional parameters
  const optionalParamsNeedingSuggestion = command.params.filter(
    param => !param.required && parameterNeedsSuggestion(param.type)
  );

  return findParamByPriority(optionalParamsNeedingSuggestion);
}

/**
 * Determines the appropriate suggestion type based on command and parameters state
 */
export function determineCommandSuggestionType(
  command: CommandOption | undefined,
  parameters: Record<string, any>,
  isComplete: boolean,
  cursorParamId: string | null = null
): SuggestionType {
  if (!command) {
    return SuggestionType.None;
  }

  // 1. If command is complete, show preview
  if (isComplete) {
    return SuggestionType.Preview;
  }

  // 2. If cursor is on a parameter, check that parameter first
  if (cursorParamId) {
    const cursorParam = command.params.find(p => p.id === cursorParamId);
    if (cursorParam) {
      const suggestionType = getSuggestionTypeForParamObject(cursorParam);
      if (suggestionType) {
        return suggestionType;
      }
    }
  }

  // 3. Find the next unfilled parameter needing suggestion
  const nextParam = findFirstUnfilledParamNeedingSuggestion(command, parameters);
  if (nextParam) {
    const suggestionType = getSuggestionTypeForParamObject(nextParam);
    return suggestionType !== null ? suggestionType : SuggestionType.None;
  }

  // 4. No parameters need suggestion, but command is not complete
  return SuggestionType.None;
}

/**
 * Integrated parameter suggestion type decision maker
 */
export function getParameterSuggestionType(
  command: CommandOption,
  cursorParamId: string | null,
  parameters: Record<string, any>
): SuggestionType {
  return determineCommandSuggestionType(command, parameters, false, cursorParamId);
}

/**
 * Handles suggestion selection and updates command content
 */
export const handleSuggestionSelect = (
  command: CommandOption,
  currentParameters: Record<string, string>,
  paramId: string,
  selectedValue: string
): { updatedContent: string } => {
  // Get command base part
  const commandBase = `/${command.title} `;

  // Find the parameter being edited
  const currentParam = command.params.find(p => p.id === paramId);
  if (!currentParam) {
    // Parameter doesn't exist, return original string
    return { updatedContent: commandBase + Object.values(currentParameters).join(' ') };
  }

  // Create updated parameters object, replacing specified parameter
  const updatedParams = { ...currentParameters, [paramId]: selectedValue };

  // Build command string with parameters in command-defined order
  let resultCommandStr = commandBase;

  // Add parameter values in the order defined in the command
  const orderedParamValues = command.params
    .map(param => updatedParams[param.id] || '')
    .filter(value => value.trim() !== '');

  if (orderedParamValues.length > 0) {
    resultCommandStr += orderedParamValues.join(' ') + ' ';
  }

  return { updatedContent: resultCommandStr };
};
