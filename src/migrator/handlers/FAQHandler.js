// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import {extractHeadingText, extractContentHtml, isElementAHeadingNode} from "./Utils";

export const headingRegex = /Frequently Asked Questions|FAQ/;

class FAQBaseHandler extends BaseHandler {
    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const $next = $element.next();
        return [$element, $next];
    }
}

export class FAQHandlerVariant_HeadingRegexAndDivWithSchema extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const $next = $e.next();
        return $e.get(0).tagName == "h2" && $e.text().match(headingRegex)
            && $next.get(0).tagName == "div" && $next.attr("itemtype") == "https://schema.org/FAQPage"
            && $next.find("section").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("section").map((i, d) => {
            return {
                question: extractHeadingText($(d).find("strong"), $), 
                answer: extractContentHtml($(d).find("div > div"), $)
            };
        }).get();
        
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByPs extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        return $e.get(0).tagName == "h2" && $e.text().match(headingRegex) && $e.next().get(0).tagName == "p";
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const expandToGetAllElementsForThisAnswer = ($a) => {
            const output = [$a];
            while ($a.next().length > 0 && this._isAnswerElement($a.next())) {
                output.push($a.next());
                $a = $a.next();
            }
            return output;
        };
                
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $q = $currElem.next();
            const $a = $q.next();
            if (!this._isQuestionElement($q) || !this._isAnswerElement($a)) {
                break;
            }
            const $aExpanded = expandToGetAllElementsForThisAnswer($a);
            // Unfortunately, because of the contract dictated by BaseHandler, even though we exactly know what is a Q and a Ans now, we 
            // still need to flatten it out into a single 1D array and again do the same operation during convert.
            elements.push($q, ...$aExpanded);
            $currElem = $aExpanded[$aExpanded.length-1];
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const tuples = this._createQnATuples(elements.slice(1));
        const items = tuples.map((tuple) => {
            const question = extractHeadingText(tuple[0], $).replace(/^Q: /, "");
            const answer = tuple[1].map(($a) => extractContentHtml($a, $)).join("").replace(/^A: /, "");
            return {question, answer};
        });
        
        return {elements: [{type: "faq", title, items}]};
    }

    _isQuestionElement($q: CheerioElemType) {
        return $q && $q.length == 1 && $q.get(0).tagName == "p" 
            && $q.children().length > 0 && $q.children().first().get(0).tagName == "strong";
    }

    _isAnswerElement($a: CheerioElemType) {
        return $a && $a.length == 1 && ["p", "ul"].includes($a.get(0).tagName) && !this._isQuestionElement($a);
    }

    _createQnATuples(elements: Array<CheerioElemType>) {
        const output = [];
        for (let i=0; i<elements.length;) {
            const tuple = [elements[i++], [elements[i++]]];
            while (true && i<elements.length) {
                if (this._isQuestionElement(elements[i])) {
                    break;
                }
                tuple[1].push(elements[i++]);
            }
            output.push(tuple);
        }
        return output;
    }
}

export class FAQHandlerVariant_HeadingRegexFollowedByDetails extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsQ = ($n) => $n.get(0).tagName == "details";
        return isElementAHeadingNode($e) && $e.text().match(headingRegex)  && nextElemIsQ($e.next()); 
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        const elements = [$element];
        let $currElem = $element;
        while (true) {
            const $nextElement = $currElem.next();
            if (!$nextElement.length > 0 || $nextElement.get(0).tagName != "details") {
                break;
            }
            elements.push($nextElement);
            $currElem = $nextElement;
        }
        return elements;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const issues = [];
        const items = elements.slice(1).map(($e) => {
            if ($e.find("iframe.video-frame").length > 0) {
                issues.push("FAQ Q&A had a video which was removed as it is not supported");
                $e.find("iframe.video-frame").remove();
            }
            const qns = extractHeadingText($e.find("summary > strong"), $);
            const ans = $e.find("summary").nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        });
        
        return {elements: [{type: "faq", title, items}], issues};
    }    
}

export class FAQHandlerVariant_HeadingRegexFollowedByDivOfDetails extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsContainerOfQs = ($n) => $n.get(0).tagName == "div" && $n.find("details").length == $n.children().length;
        return isElementAHeadingNode($e) && $e.text().match(headingRegex)  && nextElemIsContainerOfQs($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, e) => {
            const $e = $(e);
            const qns = extractHeadingText($e.find("summary > strong"), $);
            const ans = $e.find("summary").nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        return {elements: [{type: "faq", title, items}]};
    }    
}

export class FAQHandlerVariant_HeadingRegexFollowedByOL extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        const nextElemIsOL = ($n) => $n.get(0).tagName == "ol";
        return isElementAHeadingNode($e) && $e.text().match(headingRegex) && nextElemIsOL($e.next()); 
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].children().map((i, li) => {
            const $li = $(li);
            const qns = extractHeadingText($li.find("strong"), $);
            const ans = $li.find("strong").nextAll().map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        return {elements: [{type: "faq", title, items}]};
    }
}

export class FAQInsideAccordionPanelHandler extends FAQBaseHandler {
    isCapableOfProcessingElement($e: CheerioElemType) {
        // This is made to return FALSE intentionally so that this is never used directly inside handlers/index.js. 
        // This handler can be invoked only by Accordion as it finds the Panel Header to be a FAQ and then 
        // gives the Panel Body as elements into convert
        return false;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const items = elements[0].find("ul > h3, ul > li > h3").map((i, q) => {
            const $q = $(q);
            const qns = $q.parent().get(0).tagName == "ul" ? extractHeadingText($q.find("li"), $) : extractHeadingText($q, $);
            const ans = $q.nextUntil("h3,li").map((i, a) => extractContentHtml($(a), $)).get().join("");
            return {question: qns, answer: ans};
        }).get();
        
        return {elements: [{type: "faq", items}]};
    }
}