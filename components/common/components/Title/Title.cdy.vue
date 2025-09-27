<h1 v-if="finalTag === 'h1'" v-bind="$bind" :style="$style" :class="className"><slot/></h1>
<h2 v-if="finalTag === 'h2'" v-bind="$bind" :style="$style" :class="className"><slot/></h2>
<h3 v-if="finalTag === 'h3'" v-bind="$bind" :style="$style" :class="className"><slot/></h3>
<h4 v-if="finalTag === 'h4'" v-bind="$bind" :style="$style" :class="className"><slot/></h4>
<h5 v-if="finalTag === 'h5'" v-bind="$bind" :style="$style" :class="className"><slot/></h5>
<h6 v-if="finalTag === 'h6'" v-bind="$bind" :style="$style" :class="className"><slot/></h6>
