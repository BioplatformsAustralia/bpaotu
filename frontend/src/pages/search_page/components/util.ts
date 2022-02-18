import { taxonomy_ranks } from '../../../constants'

const top_level = taxonomy_ranks[0];

export function chart_enabled(component) {
    return ((!component.props.taxonomyIsLoading) &&
        (!component.props.contextualIsLoading) &&
        (!component.props.taxonomy[top_level].isDisabled))
}
