#!/usr/bin/perl -W
# $Id$

use warnings;
use strict;
use Getopt::Std;

sub usage {
	die <<EOF;
usage: $0 [-p port]
EOF
}

my %opts = (
	p => 24242,
);
getopts('p:', \%opts) or usage;
usage if @ARGV;

my $d = MyJSONServer->new(LocalPort => $opts{p});
$d->dispatch('UView');
$d->handle();
exit 0;

package MyJSONServer;

use warnings;
use strict;
use JSON::RPC::Server::Daemon;
use JSON;
use base qw(JSON::RPC::Server::Daemon);
use Data::Dumper;

sub retrieve_json_from_get {
	return encode_json({ version => 1.1, method => "uview" });
}

sub response {
	my ($self, $response) = @_;
	my $t = $response->{_content};
	$response->{_content} = q{data = } . $t;
	$self->{con}->send_response($response);
}
