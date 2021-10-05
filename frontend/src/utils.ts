/**
 * Simple helper to wrap contents in strong tags followed by a line break.
 */
 export const strongLine = (s: string): string => {
    return `<strong>${s}</strong><br />`;
  };
  
  /**
   * Returns html that contains a strong field label with a value.
   * @param {*} header Header text
   * @param {*} text Regular text
   */
  export const strongHeader = (header:string, text: string): string => {
    return `<strong>${header}:<span style='font-size:16px'>&nbsp;</span></strong>${text}<br />`;
  };
  