import { taxonomy_levels } from '../../../constants'

const top_level = taxonomy_levels[0];

export function chart_enabled(component) {
    return ((!component.props.taxonomyIsLoading) &&
        (!component.props.contextualIsLoading) &&
        (!component.props.taxonomy[top_level].isDisabled))
}
