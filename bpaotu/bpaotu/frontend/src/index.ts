import * as _ from 'lodash';
import { info } from './print';

const greeter = (person: string) => "Hello, " + person;

let user = "Tim";

// info(greeter(user));
info(greeter(_.join(_.map(user, ch => ch.toUpperCase()), '')));

