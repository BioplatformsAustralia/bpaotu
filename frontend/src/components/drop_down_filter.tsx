import { concat, map } from "lodash";
import * as React from "react";
import { Col, FormGroup, Input, Label, UncontrolledTooltip } from "reactstrap";
import Octicon from "./octicon";

import Select from "react-select";
import { OperatorAndValue } from "../search";

interface Props {
  label: string;
  info: string;
  selected: OperatorAndValue;
  optionsLoading: boolean;
  options: OperatorAndValue[];
  selectValue: (id: string) => void;
  selectOperator: (id: string) => void;
  onChange: (id: string) => void;
}

export default class DropDownFilter extends React.Component<any> {
  constructor(props) {
    super(props);
    this.onOperatorChange = this.onOperatorChange.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  }

  public render() {
    if (this.props.label === null) {
      return null; // Don't render
    }

    return (
      <FormGroup row={true}>
        {this.props.info ? (
          <Label sm={3}>
            {this.props.label + " "}
            <span id={this.props.label + "Tip"}>
              <Octicon name="info" />
            </span>
            <UncontrolledTooltip
              target={this.props.label + "Tip"}
              placement="auto"
            >
              {this.props.info}
            </UncontrolledTooltip>
          </Label>
        ) : (
          <Label sm={3}>{this.props.label}</Label>
        )}
        <Col sm={3}>
          <Input
            type="select"
            name="operator"
            disabled={this.props.isDisabled}
            value={this.props.selected.operator}
            onChange={this.onOperatorChange}
          >
            <option value="is">is</option>
            <option value="isnot">isn't</option>
          </Input>
        </Col>
        <Col sm={6}>
          <Select
            placeholder={
              this.props.optionsLoadingError
                ? this.props.optionsLoadingError
                : "---"
            }
            isSearchable={true}
            isLoading={this.props.optionsLoading}
            options={this.renderOptions()}
            isDisabled={this.props.isDisabled || this.props.optionsLoadingError}
            value={map(this.props.options, this.renderOption).filter(
              (option) => option.value === this.props.selected.value
            )}
            onChange={this.onValueChange}
          />
        </Col>
      </FormGroup>
    );
  }

  public renderOptions() {
    if (this.props.optionsLoadingError) {
      return { value: "", label: "Couldn't load values!" };
    }

    return concat(
      [{ value: "", label: "---" }],
      map(this.props.options, this.renderOption)
    );
  }

  public renderOption(option) {
    return { value: option.id, label: option.value };
  }

  public onValueChange(evt) {
    const id = evt.value;
    this.props.selectValue(id);

    if (this.props.onChange) {
      this.props.onChange();
    }
  }

  public onOperatorChange(evt: any) {
    const value = evt.target.value;
    this.props.selectOperator(value);

    if (this.props.onChange) {
      this.props.onChange();
    }
  }
}
